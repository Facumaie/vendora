import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Plan, Tenant } from '../types';

export async function isPlatformAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'platformAdmins', uid));
    return snap.exists();
  } catch { return false; }
}

export async function listTenants(): Promise<(Tenant & { userCount: number })[]> {
  const snap = await getDocs(collection(db, 'tenants'));
  return Promise.all(snap.docs.map(async (d) => {
    const users = await getDocs(collection(db, 'tenants', d.id, 'users'));
    return { id: d.id, ...d.data(), userCount: users.size } as Tenant & { userCount: number };
  }));
}

const LIMITS: Record<Plan, { maxProducts: number; maxUsers: number }> = {
  inicial: { maxProducts: 500, maxUsers: 1 },
  profesional: { maxProducts: 0, maxUsers: 5 },
  empresa: { maxProducts: 0, maxUsers: 0 },
};

export const setTenantPlan = (id: string, plan: Plan) =>
  updateDoc(doc(db, 'tenants', id), { plan, planLimits: LIMITS[plan] });

export const setTenantActive = (id: string, active: boolean) =>
  updateDoc(doc(db, 'tenants', id), { active });
