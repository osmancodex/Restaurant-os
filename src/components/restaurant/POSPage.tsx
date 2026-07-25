'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/store/cart-store';
import { useProducts } from './hooks/useProducts';
import { useCustomers } from './hooks/useCustomers';
import { useSettings, useCurrencyFormatter } from './hooks/useSettings';
import { useCreateOrder } from './hooks/useOrders';
import { useCategories } from './hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone, Search, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product, CartItem } from '@/lib/types';

export default function POSPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);

  const { data: settings } = useSettings();
  const formatCurrency = useCurrencyFormatter();
  const { data: categories } = useCategories();
  const { data: products } = useProducts({});
  const { data: customers } = useCustomers();
  const createOrder = useCreateOrder();

  const cart = useCartStore();
  const taxRate = settings?.taxPercentage || 10;

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: Product) => {
      if (!p.isActive) return false;
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, selectedCategory, search]);

  const subtotal = cart.getSubtotal();
  const taxAmount = (subtotal - cart.discount) * (taxRate / 100);
  const total = subtotal - cart.discount + taxAmount;

  async function handleCompleteOrder() {
    if (cart.items.length === 0) { toast.error('Cart is empty'); return; }

    const staff = JSON.parse(localStorage.getItem('staff') || '{}');
    const order = await createOrder.mutateAsync({
      items: cart.items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      customerId: cart.customerId,
      discount: cart.discount,
      paymentMethod: cart.paymentMethod,
      notes: cart.notes,
      staffId: staff.id,
    });

    setLastOrder(order);
    setShowReceipt(true);
    cart.clearCart();
    setShowCustomerSelect(false);
  }

  const paymentIcons = [
    { value: 'cash' as const, label: 'Cash', icon: Banknote, color: 'text-green-600' },
    { value: 'card' as const, label: 'Card', icon: CreditCard, color: 'text-blue-600' },
    { value: 'online' as const, label: 'Online', icon: Smartphone, color: 'text-purple-600' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] overflow-hidden">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
          <Button
            size="sm"
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className="flex-shrink-0"
          >
            All
          </Button>
          {categories?.map((cat: any) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex-shrink-0"
              style={selectedCategory === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-shrink-0 mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Product Grid */}
        <ScrollArea className="flex-1 mt-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
            {filteredProducts?.map((product: Product) => {
              const inCart = cart.items.find(i => i.product.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => cart.addItem(product)}
                  className={cn(
                    'relative p-3 rounded-lg border text-left transition-all hover:shadow-md active:scale-[0.98]',
                    'bg-card hover:bg-accent/50',
                    inCart && 'ring-2 ring-primary'
                  )}
                >
                  {inCart && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {inCart.quantity}
                    </div>
                  )}
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-primary font-semibold text-sm mt-1">{formatCurrency(product.price)}</p>
                  <p className={cn(
                    'text-xs mt-1',
                    product.stock <= 0 ? 'text-destructive' : product.stock <= product.lowStockAlert ? 'text-amber-500' : 'text-muted-foreground'
                  )}>
                    Stock: {product.stock}
                  </p>
                </button>
              );
            })}
            {filteredProducts?.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full lg:w-96 flex flex-col bg-card rounded-lg border min-h-0 max-h-[calc(100vh-8rem)] lg:max-h-none">
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h3 className="font-semibold">Cart</h3>
            <Badge variant="secondary" className="ml-1">{cart.getItemCount()}</Badge>
          </div>
          {cart.items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => cart.clearCart()} className="text-destructive h-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-2">
            {cart.items.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">Click products to add to cart</p>
            )}
            {cart.items.map((item: CartItem) => (
              <div key={item.product.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.product.price)} each</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => cart.updateQuantity(item.product.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => cart.updateQuantity(item.product.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm font-semibold w-20 text-right flex-shrink-0">{formatCurrency(item.total)}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => cart.removeItem(item.product.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Cart Footer */}
        <div className="border-t p-4 space-y-3 flex-shrink-0">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-16 flex-shrink-0">Discount</label>
            <Input
              type="number"
              min="0"
              value={cart.discount || ''}
              onChange={(e) => cart.setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="h-8 text-sm"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Payment</label>
            <div className="flex gap-2">
              {paymentIcons.map(pm => (
                <button
                  key={pm.value}
                  onClick={() => cart.setPaymentMethod(pm.value)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-all',
                    cart.paymentMethod === pm.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted hover:bg-muted/50'
                  )}
                >
                  <pm.icon className={cn('h-4 w-4', cart.paymentMethod === pm.value ? pm.color : '')} />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-1">
            <button
              onClick={() => setShowCustomerSelect(!showCustomerSelect)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {cart.customerId ? 'Change Customer' : '+ Add Customer'}
            </button>
            {showCustomerSelect && (
              <Select value={cart.customerId || ''} onValueChange={(v) => { cart.setCustomerId(v || null); setShowCustomerSelect(false); }}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select customer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Walk-in</SelectItem>
                  {customers?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` - ${c.phone}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes */}
          <Textarea
            placeholder="Notes (optional)"
            value={cart.notes}
            onChange={(e) => cart.setNotes(e.target.value)}
            className="text-sm min-h-[60px] resize-none"
          />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-destructive"><span>Discount</span><span>-{formatCurrency(cart.discount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span>{formatCurrency(taxAmount)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          {/* Complete Order Button */}
          <Button
            className="w-full h-11 text-base font-semibold"
            onClick={handleCompleteOrder}
            disabled={cart.items.length === 0 || createOrder.isPending}
          >
            {createOrder.isPending ? 'Processing...' : `Complete Order - ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <ReceiptModal order={lastOrder} settings={settings!} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}

function ReceiptModal({ order, settings, onClose }: { order: any; settings: any; onClose: () => void }) {
  const formatCurrency = (amount: number) => `${settings.currencySymbol}${amount.toFixed(2)}`;

  function handlePrint() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt ${order.orderNumber}</title>
      <style>body{font-family:monospace;max-width:400px;margin:0 auto;padding:20px;font-size:14px}
      table{width:100%;border-collapse:collapse}
      td{padding:4px 0}
      .center{text-align:center}
      .right{text-align:right}
      hr{border:none;border-top:1px dashed #000;margin:10px 0}
      </style></head><body>
      <div class="center"><h2>${settings.restaurantName}</h2>
      <p>${settings.address}</p><p>${settings.phone}</p></div>
      <hr>
      <p>Order: ${order.orderNumber}</p>
      <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
      ${order.staff ? `<p>Cashier: ${order.staff.name}</p>` : ''}
      ${order.customer ? `<p>Customer: ${order.customer.name}</p>` : ''}
      <hr>
      <table>${order.items.map((item: any) => 
        `<tr><td>${item.product?.name || 'Product'} x${item.quantity}</td><td class="right">${formatCurrency(item.total)}</td></tr>`
      ).join('')}</table>
      <hr>
      <table>
      <tr><td>Subtotal</td><td class="right">${formatCurrency(order.subtotal)}</td></tr>
      ${order.discount > 0 ? `<tr><td>Discount</td><td class="right">-${formatCurrency(order.discount)}</td></tr>` : ''}
      <tr><td>Tax</td><td class="right">${formatCurrency(order.taxAmount)}</td></tr>
      <tr><td><strong>TOTAL</strong></td><td class="right"><strong>${formatCurrency(order.total)}</strong></td></tr>
      </table>
      <hr>
      <p>Payment: ${order.paymentMethod.toUpperCase()}</p>
      <hr>
      <p class="center">${settings.invoiceFooter}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold">Receipt</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-6 font-mono text-sm">
            <div className="text-center mb-4">
              {settings.logo && <img src={settings.logo} alt="" className="w-16 h-16 mx-auto rounded mb-2" />}
              <h2 className="text-lg font-bold">{settings.restaurantName}</h2>
              <p className="text-muted-foreground">{settings.address}</p>
              <p className="text-muted-foreground">{settings.phone}</p>
            </div>
            <Separator className="my-3" />
            <div className="space-y-1 text-xs">
              <p>Order: <strong>{order.orderNumber}</strong></p>
              <p>Date: {new Date(order.createdAt).toLocaleString()}</p>
              {order.staff && <p>Cashier: {order.staff.name}</p>}
              {order.customer && <p>Customer: {order.customer.name}</p>}
            </div>
            <Separator className="my-3" />
            <div className="space-y-1">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.product?.name || 'Product'} x{item.quantity}</span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
            <Separator className="my-3" />
            <p className="text-xs text-center">Payment: {order.paymentMethod.toUpperCase()}</p>
            <Separator className="my-3" />
            <p className="text-xs text-center text-muted-foreground">{settings.invoiceFooter}</p>
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex gap-2 flex-shrink-0">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>Print</Button>
          <Button className="flex-1" onClick={() => { handlePrint(); onClose(); }}>Download PDF</Button>
        </div>
      </div>
    </div>
  );
}
