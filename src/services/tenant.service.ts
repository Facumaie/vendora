import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export async function register(email: string, pass: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(cred.user, { displayName });
  return cred.user;
}

const PLAN_LIMITS = {
  inicial: { maxProducts: 500, maxUsers: 1 },
  profesional: { maxProducts: 0, maxUsers: 5 }, // 0 = ilimitado
  empresa: { maxProducts: 0, maxUsers: 0 },
};

/** Crea el tenant + directorio + perfil admin + settings en un solo batch. */
export async function createBusiness(name: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');
  const tenantRef = doc(db, 'tenants', crypto.randomUUID().slice(0, 12));
  const batch = writeBatch(db);
  batch.set(tenantRef, {
    name, plan: 'inicial', planLimits: PLAN_LIMITS.inicial,
    ownerUid: user.uid, active: true, createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'userDirectory', user.uid), {
    tenantId: tenantRef.id, role: 'admin', email: user.email,
  });
  batch.set(doc(db, 'tenants', tenantRef.id, 'users', user.uid), {
    email: user.email, displayName: user.displayName || '',
    role: 'admin', active: true, createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'tenants', tenantRef.id, 'settings', 'general'), {
    businessName: name, logoUrl: '', address: '', phone: '',
    email: user.email, currency: 'ARS', taxRate: 21, ticketFooter: '¡Gracias por su compra!',
  });
  batch.set(doc(db, 'tenants', tenantRef.id, 'settings', 'counters'), { saleNumber: 0 });
  await batch.commit();
  return tenantRef.id;
}
