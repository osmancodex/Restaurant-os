import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const staffList = await db.staff.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const safeStaff = staffList.map((s) => {
      const { password: _pw, ...rest } = s;
      return {
        ...rest,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });

    return successResponse(safeStaff);
  } catch {
    return errorResponse('Failed to fetch staff');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, role } = body;

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required');
    }

    const existing = await db.staff.findUnique({ where: { email } });
    if (existing) {
      return errorResponse('A staff member with this email already exists');
    }

    const staff = await db.staff.create({
      data: {
        name,
        email,
        password,
        phone: phone || null,
        role: role || 'cashier',
      },
    });

    const { password: _pw, ...staffWithoutPassword } = staff;

    return successResponse({
      ...staffWithoutPassword,
      createdAt: staff.createdAt.toISOString(),
      updatedAt: staff.updatedAt.toISOString(),
    });
  } catch {
    return errorResponse('Failed to create staff member');
  }
}
