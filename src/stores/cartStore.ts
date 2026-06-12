import { create } from 'zustand';
import type { Product } from '../types';

export interface CartLine {
  product: Product;
  qty: number;
  discount: number; // %
}

interface CartState {
  lines: CartLine[];
  globalDiscount: number;
  add: (p: Product) => void;
  setQty: (productId: string, qty: number) => void;
  setDiscount: (productId: string, d: number) => void;
  setGlobalDiscount: (d: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>((set) => ({
  lines: [],
  globalDiscount: 0,
  add: (p) =>
    set((s) => {
      const i = s.lines.findIndex((l) => l.product.id === p.id);
      if (i >= 0) {
        const lines = [...s.lines];
        lines[i] = { ...lines[i], qty: lines[i].qty + 1 };
        return { lines };
      }
      return { lines: [...s.lines, { product: p, qty: 1, discount: 0 }] };
    }),
  setQty: (id, qty) =>
    set((s) => ({ lines: s.lines.map((l) => (l.product.id === id ? { ...l, qty: Math.max(1, qty) } : l)) })),
  setDiscount: (id, d) =>
    set((s) => ({ lines: s.lines.map((l) => (l.product.id === id ? { ...l, discount: Math.min(100, Math.max(0, d)) } : l)) })),
  setGlobalDiscount: (d) => set({ globalDiscount: Math.min(100, Math.max(0, d)) }),
  remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.product.id !== id) })),
  clear: () => set({ lines: [], globalDiscount: 0 }),
}));

export function cartTotals(lines: CartLine[], globalDiscount: number) {
  let subtotal = 0, total = 0, cost = 0;
  for (const l of lines) {
    const lineSub = l.product.salePrice * l.qty;
    subtotal += lineSub;
    total += lineSub * (1 - l.discount / 100);
    cost += l.product.costPrice * l.qty;
  }
  total *= 1 - globalDiscount / 100;
  return { subtotal, total, discountTotal: subtotal - total, cost, profit: total - cost };
}
