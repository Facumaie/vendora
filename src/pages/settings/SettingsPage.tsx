import { useEffect, useState } from 'react';
import { saveSettings, watchSettings } from '../../services/settings.service';
import { useAuth } from '../../stores/authStore';
import { useUI } from '../../stores/uiStore';
import type { BusinessSettings } from '../../types';

const EMPTY: BusinessSettings = {
  businessName: '', logoUrl: '', address: '', phone: '', email: '',
  currency: 'ARS', taxRate: 21, ticketFooter: '',
};

export default function SettingsPage() {
  const { tenantId, tenant } = useAuth();
  const notify = useUI((s) => s.notify);
  const [s, setS] = useState<BusinessSettings>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => watchSettings(tenantId!, (data) => data && setS(data)), [tenantId]);

  const save = async () => {
    setBusy(true);
    try { await saveSettings(tenantId!, s); notify('Configuración guardada'); }
    catch { notify('Error al guardar', 'error'); }
    finally { setBusy(false); }
  };

  const f = (k: keyof BusinessSettings) => ({
    value: String(s[k] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setS({ ...s, [k]: k === 'taxRate' ? +e.target.value : e.target.value }),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Configuración</h1>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Negocio</h2>
          <span className="badge bg-brand-500/15 text-brand-500 capitalize">Plan {tenant?.plan}</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label">Nombre comercial</label><input className="input" {...f('businessName')} /></div>
          <div><label className="label">Teléfono</label><input className="input" {...f('phone')} /></div>
          <div><label className="label">Email</label><input className="input" {...f('email')} /></div>
          <div className="md:col-span-2"><label className="label">Dirección</label><input className="input" {...f('address')} /></div>
          <div><label className="label">Moneda</label><input className="input" {...f('currency')} /></div>
          <div><label className="label">IVA %</label><input className="input" type="number" {...f('taxRate')} /></div>
          <div className="md:col-span-2"><label className="label">Pie del ticket</label><input className="input" {...f('ticketFooter')} /></div>
        </div>
        <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>

      <div className="card p-5 text-sm text-slate-400">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Límites del plan</h2>
        Productos: {tenant?.planLimits.maxProducts || 'Ilimitados'} · Usuarios: {tenant?.planLimits.maxUsers || 'Ilimitados'}
      </div>
    </div>
  );
}
