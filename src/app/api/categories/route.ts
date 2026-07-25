import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(categories);
  } catch (error) {
    return errorResponse('Failed to fetch categories');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Category name is required');
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#6366f1',
      },
    });

    return successResponse(category, 201);
  } catch (error) {
    return errorResponse('Failed to create category');
  }
}
