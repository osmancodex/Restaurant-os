import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      price,
      costPrice,
      categoryId,
      image,
      stock,
      lowStockAlert,
      isActive,
    } = body;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Product not found', 404);
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(price !== undefined && { price: Number(price) }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(image !== undefined && { image: image || null }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(lowStockAlert !== undefined && {
          lowStockAlert: Number(lowStockAlert),
        }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return successResponse(product);
  } catch (error) {
    return errorResponse('Failed to update product');
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });

    if (!existing) {
      return errorResponse('Product not found', 404);
    }

    if (existing._count.orderItems > 0) {
      return errorResponse(
        'Cannot delete product that has been used in orders',
        409
      );
    }

    await db.inventoryLog.deleteMany({ where: { productId: id } });
    await db.product.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse('Failed to delete product');
  }
}
