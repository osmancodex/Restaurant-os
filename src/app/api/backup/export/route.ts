import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await db.category.findMany({ orderBy: { createdAt: 'desc' } });
    const products = await db.product.findMany({ orderBy: { createdAt: 'desc' } });
    const customers = await db.customer.findMany({ orderBy: { createdAt: 'desc' } });
    const staff = await db.staff.findMany({ orderBy: { createdAt: 'desc' } });
    const orders = await db.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    const inventoryLogs = await db.inventoryLog.findMany({ orderBy: { createdAt: 'desc' } });
    const expenses = await db.expense.findMany({ orderBy: { createdAt: 'desc' } });

    const data = {
      categories: categories.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      products: products.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      customers: customers.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      staff: staff.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      orders: orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        items: o.items.map((i) => ({ ...i })),
      })),
      inventoryLogs: inventoryLogs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      expenses: expenses.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    };

    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="restaurant-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to export database' },
      { status: 500 }
    );
  }
}
