import {
  addDoc, collection, doc, getDocs, limit, onSnapshot,
  orderBy, query, updateDoc, where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { searchTokens } from '../lib/utils';
import type { Product } from '../types';

const col = (t: string) => collection(db, 'tenants', t, 'products');

export function watchProducts(t: string, cb: (p: Product[]) => void) {
  const q = query(col(t), where('active', '==', true), orderBy('name'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))));
}

export async function findByBarcode(t: string, barcode: string): Promise<Product | null> {
  const q = query(col(t), where('barcode', '==', barcode), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Product;
}

export async function saveProduct(t: string, data: Omit<Product, 'id' | 'lowStock' | 'searchTokens'>, id?: string) {
  const payload = {
    ...data,
    lowStock: data.stock <= data.minStock,
    searchTokens: searchTokens(data.name, data.brand, data.internalCode, data.barcode),
  };
  if (id) { await updateDoc(doc(col(t), id), payload); return id; }
  const refDoc = await addDoc(col(t), payload);
  return refDoc.id;
}

export const deactivateProduct = (t: string, id: string) => updateDoc(doc(col(t), id), { active: false });

export async function uploadProductImage(t: string, file: File): Promise<string> {
  const r = ref(storage, `tenants/${t}/products/${Date.now()}-${file.name}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}
