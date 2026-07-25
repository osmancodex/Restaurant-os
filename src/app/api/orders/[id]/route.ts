import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { name: true } } } },
        customer: true,
        staff: { select: { name: true, role: true } },
      },
    });
    if (!order) return errorResponse('Order not found', 404);
    return successResponse(order);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return errorResponse('Order not found', 404);

    // If cancelling or refunding, restore stock
    if ((status === 'cancelled' || status === 'refunded') && order.status === 'completed') {
      for (const item of order.items) {
        await db.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      // Update customer totals
      if (order.customerId) {
        await db.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpent: { decrement: order.total },
            orderCount: { decrement: 1 },
          },
        });
      }
    }

    const updated = await db.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: { select: { name: true } } } },
        customer: true,
      },
    });
    return successResponse(updated);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return errorResponse('Order not found', 404);

    // Restore stock
    if (order.status === 'completed') {
      for (const item of order.items) {
        await db.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
    if (order.customerId) {
      await db.customer.update({
        where: { id: order.customerId },
        data: {
          totalSpent: { decrement: order.total },
          orderCount: { decrement: 1 },
        },
      });
    }

    await db.orderItem.deleteMany({ where: { orderId: id } });
    await db.order.delete({ where: { id } });
    return successResponse({ message: 'Order deleted' });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
