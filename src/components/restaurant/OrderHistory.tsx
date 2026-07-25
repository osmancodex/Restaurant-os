'use client';

import { useState } from 'react';
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from './hooks/useOrders';
import { useSettings, useCurrencyFormatter } from './hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Trash2, Search, RotateCcw, Ban } from 'lucide-react';
import { format } from 'date-fns';
import type { Order } from '@/lib/types';

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const paymentColors: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  card: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  online: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function OrderHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: settings } = useSettings();
  const formatCurrency = useCurrencyFormatter();

  const params: Record<string, string> = {};
  if (statusFilter) params.status = statusFilter;
  if (paymentFilter) params.paymentMethod = paymentFilter;
  if (search) params.search = search;

  const { data: orders, isLoading } = useOrders(params);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium">Order #</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Date</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Customer</th>
                <th className="text-center p-3 font-medium">Items</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-center p-3 font-medium hidden sm:table-cell">Payment</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : !orders?.length ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No orders found</td></tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{order.orderNumber.slice(-8)}</td>
                    <td className="p-3 text-xs hidden sm:table-cell">{format(new Date(order.createdAt), 'MMM d, HH:mm')}</td>
                    <td className="p-3 hidden md:table-cell">{order.customer?.name || '-'}</td>
                    <td className="p-3 text-center">{order.items?.length || 0}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(order.total)}</td>
                    <td className="p-3 text-center hidden sm:table-cell">
                      <Badge variant="secondary" className={paymentColors[order.paymentMethod]}>{order.paymentMethod}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="secondary" className={statusColors[order.status]}>{order.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedOrder(order)}><Eye className="h-3.5 w-3.5" /></Button>
                        {order.status === 'completed' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-500" onClick={() => updateStatus.mutate({ id: order.id, status: 'refunded' })}><RotateCcw className="h-3.5 w-3.5" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(order.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Date:</span> {format(new Date(selectedOrder.createdAt), 'PPp')}</div>
                  <div><span className="text-muted-foreground">Payment:</span> <Badge variant="secondary" className={paymentColors[selectedOrder.paymentMethod]}>{selectedOrder.paymentMethod}</Badge></div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className={statusColors[selectedOrder.status]}>{selectedOrder.status}</Badge></div>
                  <div><span className="text-muted-foreground">Customer:</span> {selectedOrder.customer?.name || 'Walk-in'}</div>
                  {selectedOrder.notes && <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> {selectedOrder.notes}</div>}
                </div>
                <div className="space-y-1">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product?.name} x{item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-{formatCurrency(selectedOrder.discount)}</span></div>}
                  <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(selectedOrder.taxAmount)}</span></div>
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the order and restore product stock. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (deleteId) { deleteOrder.mutate(deleteId); setDeleteId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
