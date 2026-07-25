import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const staff = await db.staff.findUnique({ where: { email } });

    if (!staff) {
      return errorResponse('Invalid email or password');
    }

    if (staff.password !== password) {
      return errorResponse('Invalid email or password');
    }

    if (!staff.isActive) {
      return errorResponse('Account is deactivated');
    }

    const { password: _pw, ...staffWithoutPassword } = staff;

    return successResponse({
      staff: {
        ...staffWithoutPassword,
        createdAt: staff.createdAt.toISOString(),
        updatedAt: staff.updatedAt.toISOString(),
      },
    });
  } catch {
    return errorResponse('Login failed');
  }
}
