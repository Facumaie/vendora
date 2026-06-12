import {
  collection, doc, onSnapshot, orderBy, query, runTransaction,
  serverTimestamp, limit as qlimit, where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { MovementType, StockMovement } from '../types';

export async function registerMovement(
  t: string,
  user: { uid: string; name: string },
  productId: string,
  type: MovementType,
  qty: number, // positivo = entra, negativo = sale; 'inventario' usa qty como stock final
  notes: string,
) {
  const productRef = doc(db, 'tenants', t, 'products', productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists()) throw new Error('Producto no encontrado');
    const prev = snap.data().stock as number;
    const newStock = type === 'inventario' ? qty : prev + qty;
    if (newStock < 0) throw new Error('El stock no puede quedar negativo');
    tx.update(productRef, { stock: newStock, lowStock: newStock <= (snap.data().minStock as number) });
    const movRef = doc(collection(db, 'tenants', t, 'stockMovements'));
    tx.set(movRef, {
      productId, productName: snap.data().name, type,
      qty: type === 'inventario' ? newStock - prev : qty,
      previousStock: prev, newStock,
      userId: user.uid, userName: user.name, date: serverTimestamp(), notes,
    });
  });
}

export function watchMovements(t: string, cb: (m: StockMovement[]) => void, productId?: string) {
  const base = collection(db, 'tenants', t, 'stockMovements');
  const q = productId
    ? query(base, where('productId', '==', productId), orderBy('date', 'desc'), qlimit(100))
    : query(base, orderBy('date', 'desc'), qlimit(100));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement))));
}
