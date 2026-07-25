import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const logs = await db.inventoryLog.findMany({
      include: {
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return successResponse(logs);
  } catch (error) {
    return errorResponse('Failed to fetch inventory logs');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, type, quantity, supplier, notes } = body;

    if (!productId) {
      return errorResponse('Product ID is required');
    }
    if (type !== 'stock_in' && type !== 'stock_out') {
      return errorResponse('Type must be stock_in or stock_out');
    }
    if (!quantity || Number(quantity) <= 0) {
      return errorResponse('Quantity must be a positive number');
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return errorResponse('Product not found', 404);
    }

    const qty = Number(quantity);

    if (type === 'stock_out' && product.stock < qty) {
      return errorResponse(
        `Insufficient stock. Current stock: ${product.stock}, requested: ${qty}`,
        400
      );
    }

    const newStock =
      type === 'stock_in' ? product.stock + qty : product.stock - qty;

    await db.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    const log = await db.inventoryLog.create({
      data: {
        productId,
        type,
        quantity: qty,
        supplier: supplier?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        product: { select: { id: true, name: true } },
      },
    });

    return successResponse(log, 201);
  } catch (error) {
    return errorResponse('Failed to adjust stock');
  }
}
