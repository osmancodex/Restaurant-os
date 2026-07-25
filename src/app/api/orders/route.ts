import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, generateOrderNumber, getStartOfDay, getEndOfDay } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const where: any = {};
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const orders = await db.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true } } } },
        customer: { select: { id: true, name: true, phone: true } },
        staff: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return successResponse(orders);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerId, discount, paymentMethod, notes, staffId } = body;

    if (!items || items.length === 0) return errorResponse('Order must have at least one item');
    if (!paymentMethod) return errorResponse('Payment method is required');

    // Get tax percentage from settings
    const taxSetting = await db.setting.findUnique({ where: { key: 'taxPercentage' } });
    const taxPercentage = taxSetting ? parseFloat(taxSetting.value) : 10;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      if (!product) return errorResponse(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) return errorResponse(`Insufficient stock for ${product.name}`);

      const lineTotal = item.quantity * product.price;
      subtotal += lineTotal;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        costPrice: product.costPrice,
        total: lineTotal,
      });
    }

    const discountAmount = discount || 0;
    const taxAmount = (subtotal - discountAmount) * (taxPercentage / 100);
    const total = subtotal - discountAmount + taxAmount;
    const orderNumber = generateOrderNumber();

    const order = await db.order.create({
      data: {
        orderNumber,
        customerId: customerId || null,
        staffId: staffId || null,
        subtotal,
        discount: discountAmount,
        taxAmount,
        total,
        paymentMethod,
        status: 'completed',
        notes,
        items: { create: orderItems },
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
        customer: true,
        staff: { select: { name: true } },
      },
    });

    // Deduct stock
    for (const item of items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Update customer totals
    if (customerId) {
      await db.customer.update({
        where: { id: customerId },
        data: {
          totalSpent: { increment: total },
          orderCount: { increment: 1 },
        },
      });
    }

    return successResponse(order, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
