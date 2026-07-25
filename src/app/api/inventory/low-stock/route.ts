import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } } },
    });

    const lowStock = products.filter(
      (p) => p.stock <= p.lowStockAlert
    );

    return successResponse(lowStock);
  } catch (error) {
    return errorResponse('Failed to fetch low stock products');
  }
}
