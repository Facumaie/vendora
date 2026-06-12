import {
  collection, doc, increment, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, Timestamp, updateDoc, where, limit as qlimit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { todayKey } from '../lib/utils';
import type { CartLine } from '../stores/cartStore';
import type { Sale, SaleItem } from '../types';

/**
 * Crea la venta en una transacción atómica:
 * valida y descuenta stock, numera correlativo, registra movimientos y agrega dailyStats.
 */
export async function createSale(
  t: string,
  user: { uid: string; name: string },
  lines: CartLine[],
  globalDiscount: number,
  paymentMethod: Sale['paymentMethod'],
): Promise<{ id: string; number: number }> {
  if (!lines.length) throw new Error('El carrito está vacío');

  const saleRef = doc(collection(db, 'tenants', t, 'sales'));
  const countersRef = doc(db, 'tenants', t, 'settings', 'counters');
  const statsRef = doc(db, 'tenants', t, 'dailyStats', todayKey());

  return runTransaction(db, async (tx) => {
    // 1. Leer todo primero (regla de transacciones Firestore)
    const productRefs = lines.map((l) => doc(db, 'tenants', t, 'products', l.product.id));
    const [countersSnap, statsSnap, ...productSnaps] = await Promise.all([
      tx.get(countersRef), tx.get(statsRef), ...productRefs.map((r) => tx.get(r)),
    ]);

    const number = ((countersSnap.data()?.saleNumber as number) || 0) + 1;

    let subtotal = 0, total = 0, totalCost = 0;
    const items: SaleItem[] = [];

    productSnaps.forEach((snap, i) => {
      const l = lines[i];
      if (!snap.exists()) throw new Error(`Producto no encontrado: ${l.product.name}`);
      const current = snap.data().stock as number;
      if (current < l.qty) throw new Error(`Stock insuficiente de "${l.product.name}" (quedan ${current})`);

      const lineSub = l.product.salePrice * l.qty;
      const lineTotal = lineSub * (1 - l.discount / 100);
      const lineCost = l.product.costPrice * l.qty;
      subtotal += lineSub; total += lineTotal; totalCost += lineCost;

      items.push({
        productId: l.product.id, name: l.product.name, barcode: l.product.barcode,
        qty: l.qty, costPrice: l.product.costPrice, salePrice: l.product.salePrice,
        discount: l.discount, subtotal: lineTotal, profit: lineTotal - lineCost,
      });

      const newStock = current - l.qty;
      tx.update(productRefs[i], { stock: newStock, lowStock: newStock <= (snap.data().minStock as number) });

      const movRef = doc(collection(db, 'tenants', t, 'stockMovements'));
      tx.set(movRef, {
        productId: l.product.id, productName: l.product.name, type: 'venta',
        qty: -l.qty, previousStock: current, newStock,
        userId: user.uid, userName: user.name, date: serverTimestamp(),
        notes: `Venta #${number}`, saleId: saleRef.id,
      });
    });

    total *= 1 - globalDiscount / 100;
    const totalProfit = total - totalCost;

    tx.set(saleRef, {
      number, date: serverTimestamp(), userId: user.uid, userName: user.name,
      items, subtotal, discountTotal: subtotal - total, total, totalCost, totalProfit,
      paymentMethod, status: 'completed',
    });
    tx.set(countersRef, { saleNumber: number }, { merge: true });

    const top: Record<string, unknown> = {};
    for (const it of items) {
      top[`topProducts.${it.productId}.name`] = it.name;
      top[`topProducts.${it.productId}.qty`] = increment(it.qty);
      top[`topProducts.${it.productId}.revenue`] = increment(it.subtotal);
    }
    if (statsSnap.exists()) {
      tx.update(statsRef, {
        salesCount: increment(1), revenue: increment(total),
        cost: increment(totalCost), profit: increment(totalProfit), ...top,
      });
    } else {
      const topInit: Record<string, { name: string; qty: number; revenue: number }> = {};
      for (const it of items) topInit[it.productId] = { name: it.name, qty: it.qty, revenue: it.subtotal };
      tx.set(statsRef, { salesCount: 1, revenue: total, cost: totalCost, profit: totalProfit, topProducts: topInit });
    }

    return { id: saleRef.id, number };
  });
}

export function watchSales(t: string, cb: (s: Sale[]) => void, max = 100) {
  const q = query(collection(db, 'tenants', t, 'sales'), orderBy('date', 'desc'), qlimit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sale))));
}

export const cancelSale = (t: string, id: string) =>
  updateDoc(doc(db, 'tenants', t, 'sales', id), { status: 'cancelled' });

export function salesBetween(t: string, from: Date, to: Date, cb: (s: Sale[]) => void) {
  const q = query(
    collection(db, 'tenants', t, 'sales'),
    where('date', '>=', Timestamp.fromDate(from)),
    where('date', '<=', Timestamp.fromDate(to)),
    orderBy('date', 'desc'),
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sale))));
}
