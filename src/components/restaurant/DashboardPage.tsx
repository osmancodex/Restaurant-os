'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrencyFormatter } from './hooks/useSettings';
import { DollarSign, ShoppingBag, Package, AlertTriangle, TrendingUp, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      const { data } = await res.json();
      return data;
    },
    refetchInterval: 30000,
  });
  const formatCurrency = useCurrencyFormatter();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const stats = [
    { title: "Today's Sales", value: formatCurrency(data?.todaySales || 0), icon: DollarSign, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { title: 'Monthly Sales', value: formatCurrency(data?.monthlySales || 0), icon: TrendingUp, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Yearly Sales', value: formatCurrency(data?.yearlySales || 0), icon: CalendarDays, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Total Orders', value: data?.totalOrders?.toLocaleString() || '0', icon: ShoppingBag, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Total Products', value: data?.totalProducts?.toLocaleString() || '0', icon: Package, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
    { title: 'Low Stock Alerts', value: data?.lowStockCount?.toString() || '0', icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={cn('p-2 sm:p-3 rounded-xl', stat.color)}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base">Daily Sales (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(v) => `Date: ${v}`} />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base">Monthly Sales (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.monthlySalesChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(v) => `Month: ${v}`} />
                  <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {(data?.lowStockCount || 0) > 0 && (
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data?.lowStockProducts?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Alert at: {p.lowStockAlert}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{p.stock} left</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
