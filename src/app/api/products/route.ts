import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');

    const where: Record<string, unknown> = { isActive: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.name = { contains: search };
    }

    if (lowStock === 'true') {
      const products = await db.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, color: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const filtered = products.filter((p) => p.stock <= p.lowStockAlert);
      return successResponse(filtered);
    }

    const products = await db.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(products);
  } catch (error) {
    return errorResponse('Failed to fetch products');
  }
}

export async function POST(request: Request) {
  try {
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
    } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Product name is required');
    }

    if (
      price === undefined ||
      price === null ||
      isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      return errorResponse('Valid price is required');
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        costPrice: costPrice !== undefined ? Number(costPrice) : 0,
        categoryId: categoryId || null,
        image: image || null,
        stock: stock !== undefined ? Number(stock) : 0,
        lowStockAlert: lowStockAlert !== undefined ? Number(lowStockAlert) : 10,
      },
    });

    return successResponse(product, 201);
  } catch (error) {
    return errorResponse('Failed to create product');
  }
}
