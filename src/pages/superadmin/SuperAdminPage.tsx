import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isPlatformAdmin, listTenants, setTenantActive, setTenantPlan } from '../../services/platform.service';
import { useAuth } from '../../stores/authStore';
import { useUI } from '../../stores/uiStore';
import type { Plan, Tenant } from '../../types';

export default function SuperAdminPage() {
  const fbUser = useAuth((s) => s.fbUser);
  const notify = useUI((s) => s.notify);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tenants, setTenants] = useState<(Tenant & { userCount: number })[]>([]);

  useEffect(() => {
    if (!fbUser) return;
    isPlatformAdmin(fbUser.uid).then(async (ok) => {
      setAllowed(ok);
      if (ok) setTenants(await listTenants());
    });
  }, [fbUser]);

  if (allowed === null) return <div className="p-8 text-slate-400">Verificando…</div>;
  if (!allowed) return <Navigate to="/" replace />;

  const refresh = async () => setTenants(await listTenants());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Plataforma <span className="badge bg-amber-500/15 text-amber-500 align-middle ml-2">Superadmin</span>
      </h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4"><div className="text-xs text-slate-400 uppercase font-semibold">Comercios</div>
          <div className="text-2xl font-extrabold">{tenants.length}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-400 uppercase font-semibold">Activos</div>
          <div className="text-2xl font-extrabold">{tenants.filter(t => t.active).length}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-400 uppercase font-semibold">Usuarios totales</div>
          <div className="text-2xl font-extrabold">{tenants.reduce((a, t) => a + t.userCount, 0)}</div></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr><th className="p-3">Comercio</th><th className="p-3">Alta</th><th className="p-3">Usuarios</th>
              <th className="p-3">Plan</th><th className="p-3">Estado</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/60">
                <td className="p-3"><div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{t.id}</div></td>
                <td className="p-3 text-xs">{t.createdAt?.toDate?.().toLocaleDateString('es-AR') || '—'}</td>
                <td className="p-3">{t.userCount}</td>
                <td className="p-3">
                  <select className="input !w-auto !py-1 capitalize" value={t.plan}
                    onChange={async (e) => { await setTenantPlan(t.id, e.target.value as Plan); notify(`${t.name} → plan ${e.target.value}`); refresh(); }}>
                    <option value="inicial">Inicial</option>
                    <option value="profesional">Profesional</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </td>
                <td className="p-3">
                  <span className={`badge ${t.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-500'}`}>
                    {t.active ? 'Activo' : 'Suspendido'}</span>
                </td>
                <td className="p-3 text-right">
                  <button className="text-xs text-brand-500 hover:underline"
                    onClick={async () => { await setTenantActive(t.id, !t.active); notify(t.active ? 'Suspendido' : 'Reactivado'); refresh(); }}>
                    {t.active ? 'Suspender' : 'Reactivar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
