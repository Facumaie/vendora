import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../services/tenant.service';
import { AuthLayout } from './Login';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <AuthLayout title="Recuperar contraseña">
      {sent ? (
        <p className="text-sm">Te enviamos un email con instrucciones para restablecer tu contraseña.</p>
      ) : (
        <form onSubmit={async (e) => { e.preventDefault(); await resetPassword(email); setSent(true); }} className="space-y-4">
          <div><label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <button className="btn-primary w-full">Enviar enlace</button>
        </form>
      )}
      <p className="text-sm text-slate-400 mt-4 text-center"><Link to="/login" className="text-brand-500">Volver</Link></p>
    </AuthLayout>
  );
}
