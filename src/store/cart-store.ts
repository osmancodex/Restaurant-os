import { create } from 'zustand';
import type { Product, PaymentMethod, CartItem } from '@/lib/types';

interface CartStore {
  items: CartItem[];
  discount: number;
  customerId: string | null;
  paymentMethod: PaymentMethod;
  notes: string;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (amount: number) => void;
  setCustomerId: (id: string | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,
  customerId: null,
  paymentMethod: 'cash',
  notes: '',

  addItem: (product: Product) => {
    const items = [...get().items];
    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity += 1;
        existing.total = existing.quantity * existing.product.price;
      }
    } else {
      if (product.stock > 0) {
        items.push({ product, quantity: 1, total: product.price });
      }
    }
    set({ items });
  },

  removeItem: (productId: string) => {
    set({ items: get().items.filter(i => i.product.id !== productId) });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const items = get().items.map(i => {
      if (i.product.id === productId) {
        const qty = Math.min(quantity, i.product.stock);
        return { ...i, quantity: qty, total: qty * i.product.price };
      }
      return i;
    });
    set({ items });
  },

  setDiscount: (amount: number) => set({ discount: Math.max(0, amount) }),
  setCustomerId: (id: string | null) => set({ customerId: id }),
  setPaymentMethod: (method: PaymentMethod) => set({ paymentMethod: method }),
  setNotes: (notes: string) => set({ notes }),
  clearCart: () => set({ items: [], discount: 0, customerId: null, paymentMethod: 'cash', notes: '' }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.total, 0),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
