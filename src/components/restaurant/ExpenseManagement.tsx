'use client';

import { useState } from 'react';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from './hooks/useExpenses';
import { useCurrencyFormatter } from './hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Expense } from '@/lib/types';

const expenseCategories = ['Rent', 'Utilities', 'Supplies', 'Salaries', 'Maintenance', 'Marketing', 'Food Cost', 'Beverages', 'Miscellaneous'];

export default function ExpenseManagement() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });

  const { data: expenses, isLoading } = useExpenses(month);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const formatCurrency = useCurrencyFormatter();

  const totalExpenses = expenses?.reduce((sum: number, e: Expense) => sum + e.amount, 0) || 0;

  const categoryBreakdown = expenseCategories.map(cat => ({
    category: cat,
    total: expenses?.filter((e: Expense) => e.category === cat).reduce((sum: number, e: Expense) => sum + e.amount, 0) || 0,
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  function openCreate() {
    setEditId(null);
    setForm({ category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
    setDialogOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditId(expense.id);
    setForm({ category: expense.category, amount: expense.amount.toString(), description: expense.description || '', date: expense.date.slice(0, 10) });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.category || !form.amount || !form.date) return;
    if (editId) {
      await updateExpense.mutateAsync({ id: editId, ...form });
    } else {
      await createExpense.mutateAsync(form);
    }
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
        <div className="flex-1" />
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add Expense</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Expenses ({format(new Date(month + '-01'), 'MMMM yyyy')})</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">By Category</p>
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses this month</p>
              ) : (
                categoryBreakdown.map(c => (
                  <div key={c.category} className="flex justify-between text-sm">
                    <span>{c.category}</span>
                    <span className="font-medium">{formatCurrency(c.total)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="max-h-[50vh]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Description</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : !expenses?.length ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No expenses found</td></tr>
              ) : (
                expenses.map((expense: Expense) => (
                  <tr key={expense.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                    <td className="p-3"><span className="inline-flex px-2 py-0.5 rounded-full bg-muted text-xs font-medium">{expense.category}</span></td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground max-w-[200px] truncate">{expense.description || '-'}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(expense.amount)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(expense)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(expense.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Category *</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount *</label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-medium">Date *</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.category || !form.amount}>{editId ? 'Update' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (deleteId) { deleteExpense.mutate(deleteId); setDeleteId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}