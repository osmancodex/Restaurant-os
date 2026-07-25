import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return errorResponse('No backup data provided');
    }

    // Clear existing data in correct order (respecting foreign keys)
    await db.orderItem.deleteMany();
    await db.order.deleteMany();
    await db.inventoryLog.deleteMany();
    await db.expense.deleteMany();
    await db.product.deleteMany();
    await db.customer.deleteMany();
    await db.category.deleteMany();
    await db.staff.deleteMany();

    // Restore categories
    if (data.categories?.length) {
      for (const cat of data.categories) {
        const { id, _count, createdAt, updatedAt, ...rest } = cat;
        await db.category.create({ data: rest });
      }
    }

    // Restore customers
    if (data.customers?.length) {
      for (const cust of data.customers) {
        const { id, _count, createdAt, updatedAt, orders, ...rest } = cust;
        await db.customer.create({ data: rest });
      }
    }

    // Restore staff
    if (data.staff?.length) {
      for (const s of data.staff) {
        const { id, createdAt, updatedAt, orders, ...rest } = s;
        await db.staff.create({ data: rest });
      }
    }

    // Restore products
    if (data.products?.length) {
      for (const p of data.products) {
        const { id, createdAt, updatedAt, category, orderItems, inventoryLogs, ...rest } = p;
        await db.product.create({ data: rest });
      }
    }

    // Restore orders with items
    if (data.orders?.length) {
      for (const o of data.orders) {
        const { id, createdAt, updatedAt, customer, staff, items, ...orderRest } = o;
        const order = await db.order.create({ data: orderRest });

        if (items?.length) {
          for (const item of items) {
            const { id: itemId, order, product, ...itemRest } = item;
            await db.orderItem.create({
              data: { ...itemRest, orderId: order.id },
            });
          }
        }
      }
    }

    // Restore inventory logs
    if (data.inventoryLogs?.length) {
      for (const log of data.inventoryLogs) {
        const { id, createdAt, product, ...rest } = log;
        await db.inventoryLog.create({ data: rest });
      }
    }

    // Restore expenses
    if (data.expenses?.length) {
      for (const exp of data.expenses) {
        const { id, createdAt, updatedAt, date, ...rest } = exp;
        await db.expense.create({
          data: { ...rest, date: new Date(date) },
        });
      }
    }

    return successResponse({ message: 'Database restored successfully' });
  } catch (err) {
    console.error('Restore error:', err);
    return errorResponse('Failed to restore database');
  }
}
