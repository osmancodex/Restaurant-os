import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, color, isActive } = body;

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Category not found', 404);
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return successResponse(category);
  } catch (error) {
    return errorResponse('Failed to update category');
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Category not found', 404);
    }

    // Set categoryId to null on related products
    await db.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await db.category.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse('Failed to delete category');
  }
}
