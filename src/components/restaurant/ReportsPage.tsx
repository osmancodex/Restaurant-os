'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, DollarSign, TrendingUp, Receipt, ShoppingBag } from 'lucide-react';
import { useCurrencyFormatter } from './hooks/useSettings';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const formatCurrency = useCurrencyFormatter();

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['report', reportType, customStart, customEnd, paymentFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ type: reportType });
      if (reportType === 'custom') { params.set('startDate', customStart); params.set('endDate', customEnd); }
      if (paymentFilter) params.set('paymentMethod', paymentFilter);
      const res = await fetch(`/api/reports?${params}`);
      const { data } = await res.json();
      return data;
    },
    enabled: reportType !== 'custom' || (customStart && customEnd),
  });

  function handleExportPDF() {
    if (!report) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const periodLabel = { daily: 'Daily', monthly: 'Monthly', yearly: 'Yearly', custom: 'Custom' }[reportType];
    w.document.write(`
      <html><head><title>${periodLabel} Report</title>
      <style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;font-size:14px}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #eee}
      th{background:#f5f5f5;font-weight:600}
      .right{text-align:right}
      .summary{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}
      .summary-card{background:#f9f9f9;padding:16px;border-radius:8px}
      .summary-card h3{margin:0 0 8px;font-size:13px;color:#666}
      .summary-card p{margin:0;font-size:24px;font-weight:700}
      h1{margin:0}h2{margin:8px 0 0;color:#666;font-size:16px}
      @media print{body{padding:20px}}</style></head><body>
      <h1>${periodLabel} Sales Report</h1>
      <h2>${report.startDate ? new Date(report.startDate).toLocaleDateString() : ''} - ${report.endDate ? new Date(report.endDate).toLocaleDateString() : ''}</h2>
      <div class="summary">
        <div class="summary-card"><h3>Total Sales</h3><p>${formatCurrency(report.totalSales)}</p></div>
        <div class="summary-card"><h3>Total Profit</h3><p>${formatCurrency(report.totalProfit)}</p></div>
        <div class="summary-card"><h3>Total Tax</h3><p>${formatCurrency(report.totalTax)}</p></div>
        <div class="summary-card"><h3>Number of Orders</h3><p>${report.orderCount}</p></div>
      </div>
      <table><thead><tr><th>Order #</th><th>Date</th><th>Customer</th><th>Payment</th><th class="right">Total</th></tr></thead>
      <tbody>${(report.orders || []).map((o: any) => `<tr><td>${o.orderNumber}</td><td>${new Date(o.createdAt).toLocaleString()}</td><td>${o.customer?.name || 'Walk-in'}</td><td>${o.paymentMethod}</td><td class="right">${formatCurrency(o.total)}</td></tr>`).join('')}</tbody></table>
      <script>window.print()</script></body></html>
    `);
    w.document.close();
  }

  return (
    <div className="space-y-4">
      {/* Report Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reportType === 'custom' && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Start</label>
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-44" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">End</label>
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-44" />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Payment</label>
              <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => refetch()}>Generate</Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={!report}><Download className="h-4 w-4 mr-1" />Export PDF</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600" /><div><p className="text-xs text-muted-foreground">Total Sales</p><p className="text-xl font-bold">{formatCurrency(report.totalSales)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-blue-600" /><div><p className="text-xs text-muted-foreground">Total Profit</p><p className="text-xl font-bold">{formatCurrency(report.totalProfit)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Receipt className="h-8 w-8 text-amber-600" /><div><p className="text-xs text-muted-foreground">Total Tax</p><p className="text-xl font-bold">{formatCurrency(report.totalTax)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><ShoppingBag className="h-8 w-8 text-purple-600" /><div><p className="text-xs text-muted-foreground">Orders</p><p className="text-xl font-bold">{report.orderCount}</p></div></CardContent></Card>
        </div>
      )}

      {/* Orders Table */}
      {report && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Orders ({report.orderCount})</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[50vh]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium">Order #</th>
                    <th className="text-left p-3 font-medium hidden sm:table-cell">Date</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Customer</th>
                    <th className="text-center p-3 font-medium hidden sm:table-cell">Payment</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {!report.orders?.length ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No orders in this period</td></tr>
                  ) : (
                    report.orders.map((order: any) => (
                      <tr key={order.id} className="border-t">
                        <td className="p-3 font-mono text-xs">{order.orderNumber.slice(-8)}</td>
                        <td className="p-3 text-xs hidden sm:table-cell">{new Date(order.createdAt).toLocaleString()}</td>
                        <td className="p-3 hidden md:table-cell">{order.customer?.name || 'Walk-in'}</td>
                        <td className="p-3 text-center hidden sm:table-cell">{order.paymentMethod}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(order.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}