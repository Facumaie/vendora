import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBusiness } from '../../services/tenant.service';
import { useAuth } from '../../stores/authStore';
import { AuthLayout } from './Login';

export default function CreateBusiness() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const refreshTenant = useAuth((s) => s.refreshTenant);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await createBusiness(name.trim());
      await refreshTenant();
      nav('/');
    } catch { setError('No se pudo crear el negocio. Intentá de nuevo.'); }
    finally { setBusy(false); }
  };

  return (
    <AuthLayout title="Creá tu negocio" subtitle="Último paso">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Nombre del comercio</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kiosco El Sol" required minLength={2} />
        </div>
        {error && <p className="text-rose-500 text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creando…' : 'Crear negocio'}</button>
      </form>
    </AuthLayout>
  );
}
