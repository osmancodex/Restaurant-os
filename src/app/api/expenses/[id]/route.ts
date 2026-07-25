import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { category, amount, description, date } = body;
    const expense = await db.expense.update({
      where: { id },
      data: { category, amount: amount ? parseFloat(amount) : undefined, description, date: date ? new Date(date) : undefined },
    });
    return successResponse(expense);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.expense.delete({ where: { id } });
    return successResponse({ message: 'Expense deleted' });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}