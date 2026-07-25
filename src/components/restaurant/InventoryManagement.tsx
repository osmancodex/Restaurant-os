'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useInventoryLogs,
  useAdjustStock,
  useLowStockProducts,
  type AdjustStockInput,
} from './hooks/useInventory';
import { useProducts } from './hooks/useProducts';
import type { InventoryLog, Product } from '@/lib/types';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Warehouse,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
} from 'lucide-react';

const PAGE_SIZE = 15;

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InventoryManagement() {
  const { data: products = [] } = useProducts({});
  const { data: logs = [], isLoading: logsLoading } = useInventoryLogs();
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const adjustMutation = useAdjustStock();

  const [form, setForm] = useState<AdjustStockInput>({
    productId: '',
    type: 'stock_in',
    quantity: 1,
    supplier: '',
    notes: '',
  });
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productId) {
      toast.error('Please select a product');
      return;
    }
    if (form.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    adjustMutation.mutate(form, {
      onSuccess: () => {
        toast.success(
          form.type === 'stock_in'
            ? `Added ${form.quantity} units to stock`
            : `Removed ${form.quantity} units from stock`
        );
        setForm({
          productId: '',
          type: 'stock_in',
          quantity: 1,
          supplier: '',
          notes: '',
        });
        setPage(1);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Warehouse className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Manage stock levels and view adjustment history
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Adjustment Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Adjust Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inv-product">Product</Label>
                  <Select
                    value={form.productId}
                    onValueChange={(val) => setForm({ ...form, productId: val })}
                  >
                    <SelectTrigger id="inv-product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (stock: {p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inv-type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(val) =>
                      setForm({ ...form, type: val as 'stock_in' | 'stock_out' })
                    }
                  >
                    <SelectTrigger id="inv-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock_in">
                        <div className="flex items-center gap-2">
                          <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
                          Stock In
                        </div>
                      </SelectItem>
                      <SelectItem value="stock_out">
                        <div className="flex items-center gap-2">
                          <ArrowUpFromLine className="h-3.5 w-3.5 text-red-600" />
                          Stock Out
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inv-qty">Quantity</Label>
                  <Input
                    id="inv-qty"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: Number(e.target.value) || 1 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inv-supplier">Supplier (optional)</Label>
                  <Input
                    id="inv-supplier"
                    placeholder="Supplier name"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inv-notes">Notes (optional)</Label>
                  <Textarea
                    id="inv-notes"
                    placeholder="Reason for adjustment..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={adjustMutation.isPending}
                >
                  {adjustMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {form.type === 'stock_in' ? (
                    <>
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      Add Stock
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="h-4 w-4 mr-2" />
                      Remove Stock
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table + Low Stock Alert */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lowStockProducts.map((p) => (
                    <Badge
                      key={p.id}
                      variant="outline"
                      className="border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-400"
                    >
                      {p.name}: <strong>{p.stock}</strong> / {p.lowStockAlert}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs Table */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Adjustment History</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {logs.length} record{logs.length !== 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Package className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">No inventory adjustments yet</p>
                </div>
              ) : (
                <>
                  <div className="max-h-[480px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">Date</TableHead>
                          <TableHead className="min-w-[140px]">Product</TableHead>
                          <TableHead className="min-w-[80px]">Type</TableHead>
                          <TableHead className="min-w-[70px] text-right">Qty</TableHead>
                          <TableHead className="min-w-[100px]">Supplier</TableHead>
                          <TableHead className="min-w-[140px]">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDateTime(log.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {log.product?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {log.type === 'stock_in' ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                >
                                  <ArrowDownToLine className="h-3 w-3 mr-1" />
                                  In
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                >
                                  <ArrowUpFromLine className="h-3 w-3 mr-1" />
                                  Out
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {log.type === 'stock_in' ? '+' : '-'}{log.quantity}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.supplier || '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">
                              {log.notes || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
