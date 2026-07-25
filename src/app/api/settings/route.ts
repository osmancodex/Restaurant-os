import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, getSettings } from '@/lib/api-utils';

export async function GET() {
  try {
    const settings = await getSettings();
    return successResponse(settings);
  } catch {
    return errorResponse('Failed to fetch settings');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updates: Record<string, string> = body;

    if (!updates || typeof updates !== 'object') {
      return errorResponse('Invalid settings data');
    }

    for (const [key, value] of Object.entries(updates)) {
      await db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    const settings = await getSettings();
    return successResponse(settings);
  } catch {
    return errorResponse('Failed to update settings');
  }
}
