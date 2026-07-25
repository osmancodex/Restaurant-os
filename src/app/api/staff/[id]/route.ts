import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, password, phone, role, isActive } = body;

    const existing = await db.staff.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Staff member not found');
    }

    // Check email uniqueness if changed
    if (email && email !== existing.email) {
      const emailExists = await db.staff.findUnique({ where: { email } });
      if (emailExists) {
        return errorResponse('A staff member with this email already exists');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined && password !== '') updateData.password = password;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const staff = await db.staff.update({
      where: { id },
      data: updateData,
    });

    const { password: _upw, ...staffWithoutPassword } = staff;

    return successResponse({
      ...staffWithoutPassword,
      createdAt: staff.createdAt.toISOString(),
      updatedAt: staff.updatedAt.toISOString(),
    });
  } catch {
    return errorResponse('Failed to update staff member');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.staff.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Staff member not found');
    }

    // Soft delete
    const staff = await db.staff.update({
      where: { id },
      data: { isActive: false },
    });

    const { password: _dpw, ...staffWithoutPassword } = staff;

    return successResponse({
      ...staffWithoutPassword,
      createdAt: staff.createdAt.toISOString(),
      updatedAt: staff.updatedAt.toISOString(),
    });
  } catch {
    return errorResponse('Failed to delete staff member');
  }
}
