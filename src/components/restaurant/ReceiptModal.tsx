'use client';

import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Order, RestaurantSettings } from '@/lib/types';
import { Printer, Download } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  settings: RestaurantSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReceiptModal({ order, settings, open, onOpenChange }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const symbol = settings.currencySymbol || '$';
  const fmt = (n: number) => `${symbol}${n.toFixed(2)}`;

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt ${order.orderNumber}</title>
      <style>body{font-family:monospace;font-size:12px;padding:20px;max-width:320px;margin:0 auto}
      .center{text-align:center}.right{text-align:right}.sep{border-top:1px dashed #ccc;margin:8px 0}
      table{width:100%;border-collapse:collapse}td{padding:2px 0}</style></head>
      <body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  function handleDownload() {
    const content = printRef.current;
    if (!content) return;
    const text = content.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${order.orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <div ref={printRef} className="border rounded-lg p-4 bg-white text-black text-xs font-mono max-h-[60vh] overflow-y-auto">
          <div className="center text-base font-bold mb-1">{settings.restaurantName}</div>
          {settings.address && <div className="center text-gray-500 mb-1">{settings.address}</div>}
          {settings.phone && <div className="center text-gray-500 mb-1">{settings.phone}</div>}

          <div className="sep" />

          <div className="flex justify-between mb-1">
            <span>Order #{order.orderNumber}</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Payment</span>
            <span className="uppercase">{order.paymentMethod}</span>
          </div>
          {order.customer && (
            <div className="flex justify-between mb-1">
              <span>Customer</span>
              <span>{order.customer.name}</span>
            </div>
          )}
          {order.staff && (
            <div className="flex justify-between mb-1">
              <span>Cashier</span>
              <span>{order.staff.name}</span>
            </div>
          )}

          <div className="sep" />

          <table>
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left pb-1">Item</th>
                <th className="text-center pb-1">Qty</th>
                <th className="text-right pb-1">Price</th>
                <th className="text-right pb-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-0.5">
                    <div>{item.productName || item.productId}</div>
                    {item.quantity > 1 && <div className="text-gray-400">{fmt(item.price)} each</div>}
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{fmt(item.price)}</td>
                  <td className="text-right">{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="sep" />

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-{fmt(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{fmt(order.taxAmount)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-bold">
              <span>TOTAL</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <>
              <div className="sep" />
              <div><span className="font-semibold">Notes: </span>{order.notes}</div>
            </>
          )}

          {settings.invoiceFooter && (
            <>
              <div className="sep" />
              <div className="center text-gray-400">{settings.invoiceFooter}</div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
