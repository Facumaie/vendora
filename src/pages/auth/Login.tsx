import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '../../services/tenant.service';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type Form = z.infer<typeof schema>;

export default function Login() {
  const nav = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: Form) => {
    setError('');
    try { await login(d.email, d.password); nav('/'); }
    catch { setError('Email o contraseña incorrectos'); }
  };

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Controlá tu stock. Impulsá tus ventas.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" {...register('email')} />
          {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input className="input" type="password" {...register('password')} />
          {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        {error && <p className="text-rose-500 text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={isSubmitting}>Entrar</button>
        <div className="flex justify-between text-sm text-slate-400">
          <Link to="/recuperar" className="hover:text-brand-500">Olvidé mi contraseña</Link>
          <Link to="/registro" className="hover:text-brand-500">Crear cuenta</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-slate-50 to-brand-50 dark:from-slate-950 dark:to-slate-900">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white grid place-items-center font-extrabold text-lg">V</div>
          <div>
            <div className="font-extrabold text-xl tracking-tight">Vendora</div>
            {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
          </div>
        </div>
        <h1 className="text-lg font-bold mb-4">{title}</h1>
        {children}
      </div>
    </div>
  );
}
