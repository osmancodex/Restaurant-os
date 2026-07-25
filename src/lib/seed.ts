import { db } from './db';

const defaultSettings = [
  { key: 'restaurantName', value: 'My Restaurant' },
  { key: 'address', value: '123 Main Street, City' },
  { key: 'phone', value: '+1 234 567 890' },
  { key: 'taxPercentage', value: '10' },
  { key: 'currency', value: 'USD' },
  { key: 'currencySymbol', value: '$' },
  { key: 'invoiceFooter', value: 'Thank you for dining with us!' },
  { key: 'logo', value: '' },
];

export async function seedSettings() {
  for (const setting of defaultSettings) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { id: setting.key, key: setting.key, value: setting.value },
    });
  }
}

export async function seedDefaultAdmin() {
  const existing = await db.staff.findFirst({ where: { role: 'admin' } });
  if (!existing) {
    await db.staff.create({
      data: {
        name: 'Admin',
        email: 'admin@restaurant.com',
        password: 'admin123',
        role: 'admin',
      },
    });
  }
}

export async function seedDefaultCategories() {
  const existing = await db.category.count();
  if (existing === 0) {
    await db.category.createMany({
      data: [
        { name: 'Appetizers', color: '#f97316' },
        { name: 'Main Course', color: '#22c55e' },
        { name: 'Beverages', color: '#3b82f6' },
        { name: 'Desserts', color: '#ec4899' },
        { name: 'Sides', color: '#8b5cf6' },
      ],
    });
  }
}

export async function seedAll() {
  await seedSettings();
  await seedDefaultAdmin();
  await seedDefaultCategories();
  console.log('Seeding complete');
}
