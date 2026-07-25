import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, getStartOfMonth, getEndOfMonth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM format

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59, 999);
    }

    const where: any = {};
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    return successResponse(expenses);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, amount, description, date } = body;
    if (!category || !amount || !date) return errorResponse('Category, amount, and date are required');
    const expense = await db.expense.create({
      data: { category, amount: parseFloat(amount), description, date: new Date(date) },
    });
    return successResponse(expense, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}