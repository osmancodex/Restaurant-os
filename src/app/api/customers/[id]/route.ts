import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, address } = body;
    const customer = await db.customer.update({
      where: { id },
      data: { name, phone, email, address },
    });
    return successResponse(customer);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer) return errorResponse('Customer not found', 404);
    if (customer.orderCount > 0) return errorResponse('Cannot delete customer with orders');
    await db.customer.delete({ where: { id } });
    return successResponse({ message: 'Customer deleted' });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
