'use client';

import { useState } from 'react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from './hooks/useCustomers';
import { useCurrencyFormatter } from './hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { Customer } from '@/lib/types';

const emptyCustomer = { name: '', phone: '', email: '', address: '' };

export default function CustomerManagement() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOrdersId, setViewOrdersId] = useState<string | null>(null);

  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const formatCurrency = useCurrencyFormatter();

  const { data: customerOrders } = useQuery({
    queryKey: ['customer-orders', viewOrdersId],
    queryFn: async () => {
      const res = await fetch(`/api/orders?search=${customers?.find(c => c.id === viewOrdersId)?.name || ''}`);
      const { data } = await res.json();
      return data;
    },
    enabled: !!viewOrdersId,
  });

  const filtered = customers?.filter((c: Customer) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  function openCreate() {
    setEditId(null);
    setForm(emptyCustomer);
    setDialogOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditId(customer.id);
    setForm({ name: customer.name, phone: customer.phone || '', email: customer.email || '', address: customer.address || '' });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    if (editId) {
      await updateCustomer.mutateAsync({ id: editId, ...form });
    } else {
      await createCustomer.mutateAsync(form);
    }
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add Customer</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <ScrollArea className="max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Phone</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-right p-3 font-medium">Spent</th>
                <th className="text-center p-3 font-medium">Orders</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No customers found</td></tr>
              ) : (
                filtered.map((customer: Customer) => (
                  <tr key={customer.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">{customer.name}</td>
                    <td className="p-3 hidden sm:table-cell">{customer.phone || '-'}</td>
                    <td className="p-3 hidden md:table-cell">{customer.email || '-'}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(customer.totalSpent)}</td>
                    <td className="p-3 text-center">{customer.orderCount}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewOrdersId(customer.id)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(customer)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(customer.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Customer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" /></div>
            <div><label className="text-sm font-medium">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" /></div>
            <div><label className="text-sm font-medium">Email</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" /></div>
            <div><label className="text-sm font-medium">Address</label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{editId ? 'Update' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Orders Dialog */}
      <Dialog open={!!viewOrdersId} onOpenChange={() => setViewOrdersId(null)}>
        <DialogContent className="max-w-lg max-h-[70vh]">
          <DialogHeader><DialogTitle>Customer Orders</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-2 pr-4">
              {!customerOrders?.length ? (
                <p className="text-center py-8 text-muted-foreground">No orders found</p>
              ) : (
                customerOrders.map((order: any) => (
                  <div key={order.id} className="flex justify-between items-center p-3 rounded-lg border">
                    <div>
                      <p className="font-mono text-xs">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'MMM d, HH:mm')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground">{order.items?.length} items</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this customer. Customers with orders cannot be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (deleteId) { deleteCustomer.mutate(deleteId); setDeleteId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
