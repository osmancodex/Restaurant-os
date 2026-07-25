import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily'; // daily, monthly, yearly, custom
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentMethod = searchParams.get('paymentMethod');
    const productId = searchParams.get('productId');

    let start: Date;
    let end: Date;
    const now = new Date();

    if (type === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (type === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (type === 'yearly') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const where: any = {
      createdAt: { gte: start, lte: end },
      status: 'completed',
    };

    if (paymentMethod) where.paymentMethod = paymentMethod;

    let orders = await db.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true } } } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by productId if specified
    if (productId) {
      orders = orders.filter(o =>
        o.items.some(item => item.productId === productId)
      );
    }

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalSubtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);
    const totalTax = orders.reduce((sum, o) => sum + o.taxAmount, 0);

    // Calculate profit (total - cost of goods)
    let totalCost = 0;
    for (const order of orders) {
      for (const item of order.items) {
        totalCost += (item.costPrice || 0) * item.quantity;
      }
    }
    const totalProfit = totalSales - totalCost - totalTax;

    return successResponse({
      period: type,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalSales,
      totalProfit: Math.max(0, totalProfit),
      totalTax,
      totalDiscount,
      totalCost,
      orderCount: orders.length,
      orders,
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
