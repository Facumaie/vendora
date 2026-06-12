import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BusinessSettings } from '../types';

export function watchSettings(t: string, cb: (s: BusinessSettings | null) => void) {
  return onSnapshot(doc(db, 'tenants', t, 'settings', 'general'), (snap) =>
    cb(snap.exists() ? (snap.data() as BusinessSettings) : null),
  );
}

export const saveSettings = (t: string, s: Partial<BusinessSettings>) =>
  setDoc(doc(db, 'tenants', t, 'settings', 'general'), s, { merge: true });
