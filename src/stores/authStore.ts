import { create } from 'zustand';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { AppUser, Role, Tenant } from '../types';

interface AuthState {
  initialized: boolean;
  fbUser: User | null;
  tenantId: string | null;
  tenant: Tenant | null;
  profile: AppUser | null;
  role: Role | null;
  needsBusiness: boolean;
  init: () => void;
  refreshTenant: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  initialized: false,
  fbUser: null,
  tenantId: null,
  tenant: null,
  profile: null,
  role: null,
  needsBusiness: false,

  init: () => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        set({ initialized: true, fbUser: null, tenantId: null, tenant: null, profile: null, role: null, needsBusiness: false });
        return;
      }
      const dirSnap = await getDoc(doc(db, 'userDirectory', user.uid));
      if (!dirSnap.exists()) {
        set({ initialized: true, fbUser: user, needsBusiness: true });
        return;
      }
      const { tenantId, role } = dirSnap.data() as { tenantId: string; role: Role };
      const [tenantSnap, profileSnap] = await Promise.all([
        getDoc(doc(db, 'tenants', tenantId)),
        getDoc(doc(db, 'tenants', tenantId, 'users', user.uid)),
      ]);
      set({
        initialized: true,
        fbUser: user,
        tenantId,
        role,
        tenant: tenantSnap.exists() ? ({ id: tenantSnap.id, ...tenantSnap.data() } as Tenant) : null,
        profile: profileSnap.exists() ? ({ uid: user.uid, ...profileSnap.data() } as AppUser) : null,
        needsBusiness: false,
      });
    });
  },

  refreshTenant: async () => {
    const { fbUser } = get();
    if (!fbUser) return;
    const dirSnap = await getDoc(doc(db, 'userDirectory', fbUser.uid));
    if (!dirSnap.exists()) return;
    const { tenantId, role } = dirSnap.data() as { tenantId: string; role: Role };
    const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
    const profileSnap = await getDoc(doc(db, 'tenants', tenantId, 'users', fbUser.uid));
    set({
      tenantId, role, needsBusiness: false,
      tenant: tenantSnap.exists() ? ({ id: tenantSnap.id, ...tenantSnap.data() } as Tenant) : null,
      profile: profileSnap.exists() ? ({ uid: fbUser.uid, ...profileSnap.data() } as AppUser) : null,
    });
  },

  logout: async () => { await signOut(auth); },
}));

const PERMISSIONS: Record<Role, string[]> = {
  admin: ['*'],
  supervisor: ['products:write', 'stock:write', 'sales:create', 'sales:cancel', 'reports:view', 'audit:view'],
  operador: ['sales:create', 'products:read', 'stock:read'],
};

export function can(role: Role | null, perm: string): boolean {
  if (!role) return false;
  const list = PERMISSIONS[role];
  return list.includes('*') || list.includes(perm);
}
