import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { todayKey } from '../lib/utils';

export interface DailyStat {
  id: string;
  salesCount: number;
  revenue: number;
  cost: number;
  profit: number;
  topProducts?: Record<string, { name: string; qty: number; revenue: number }>;
}

export function watchToday(t: string, cb: (s: DailyStat | null) => void) {
  return onSnapshot(doc(db, 'tenants', t, 'dailyStats', todayKey()), (snap) =>
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as DailyStat) : null),
  );
}

export function watchRange(t: string, fromKey: string, cb: (s: DailyStat[]) => void) {
  const q = query(
    collection(db, 'tenants', t, 'dailyStats'),
    where('__name__', '>=', fromKey),
    orderBy('__name__'),
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyStat))));
}
