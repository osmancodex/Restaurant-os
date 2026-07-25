import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(customers);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, address } = body;
    if (!name) return errorResponse('Customer name is required');
    const customer = await db.customer.create({
      data: { name, phone, email, address },
    });
    return successResponse(customer, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
