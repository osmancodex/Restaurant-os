import { successResponse } from '@/lib/api-utils';

export async function POST() {
  return successResponse({ message: 'Logged out successfully' });
}
