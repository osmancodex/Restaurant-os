import { db } from '@/lib/db';
import { successResponse, errorResponse, getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear } from '@/lib/api-utils';

export async function GET() {
  try {
    const now = new Date();

    // Today's sales
    const todayOrders = await db.order.findMany({
      where: { createdAt: { gte: getStartOfDay(now), lte: getEndOfDay(now) }, status: 'completed' },
      select: { total: true },
    });
    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // Monthly sales
    const monthOrders = await db.order.findMany({
      where: { createdAt: { gte: getStartOfMonth(now), lte: getEndOfMonth(now) }, status: 'completed' },
      select: { total: true },
    });
    const monthlySales = monthOrders.reduce((sum, o) => sum + o.total, 0);

    // Yearly sales
    const yearOrders = await db.order.findMany({
      where: { createdAt: { gte: getStartOfYear(now), lte: getEndOfYear(now) }, status: 'completed' },
      select: { total: true },
    });
    const yearlySales = yearOrders.reduce((sum, o) => sum + o.total, 0);

    // Total orders
    const totalOrders = await db.order.count({ where: { status: 'completed' } });

    // Total products
    const totalProducts = await db.product.count({ where: { isActive: true } });

    // Low stock count
    const allProducts = await db.product.findMany({ where: { isActive: true } });
    const lowStockCount = allProducts.filter(p => p.stock <= p.lowStockAlert).length;

    // Daily sales chart (last 7 days)
    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayOrders = await db.order.findMany({
        where: { createdAt: { gte: getStartOfDay(d), lte: getEndOfDay(d) }, status: 'completed' },
        select: { total: true },
      });
      dailySales.push({
        date: d.toISOString().slice(0, 10),
        sales: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      });
    }

    // Monthly sales chart (last 6 months)
    const monthlySalesChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthOrdersData = await db.order.findMany({
        where: { createdAt: { gte: getStartOfMonth(d), lte: getEndOfMonth(d) }, status: 'completed' },
        select: { total: true },
      });
      monthlySalesChart.push({
        date: d.toISOString().slice(0, 7),
        sales: monthOrdersData.reduce((sum, o) => sum + o.total, 0),
        orders: monthOrdersData.length,
      });
    }

    // Low stock products
    const lowStockProducts = allProducts.filter(p => p.stock <= p.lowStockAlert).slice(0, 5);

    return successResponse({
      todaySales,
      monthlySales,
      yearlySales,
      totalOrders,
      totalProducts,
      lowStockCount,
      dailySales,
      monthlySalesChart,
      lowStockProducts,
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
