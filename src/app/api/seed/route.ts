import { successResponse } from '@/lib/api-utils';
import { seedAll } from '@/lib/seed';

export async function POST() {
  await seedAll();
  return successResponse({ message: 'Database seeded successfully' });
}
