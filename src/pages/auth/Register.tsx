import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as signup } from '../../services/tenant.service';
import { AuthLayout } from './Login';

const schema = z.object({
  displayName: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type Form = z.infer<typeof schema>;

export default function Register() {
  const nav = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: Form) => {
    setError('');
    try { await signup(d.email, d.password, d.displayName); nav('/crear-negocio'); }
    catch (e: any) {
      setError(e?.code === 'auth/email-already-in-use' ? 'Ese email ya está registrado' : 'No se pudo crear la cuenta');
    }
  };

  return (
    <AuthLayout title="Crear cuenta">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div><label className="label">Nombre</label><input className="input" {...register('displayName')} />
          {errors.displayName && <p className="text-rose-500 text-xs mt-1">{errors.displayName.message}</p>}</div>
        <div><label className="label">Email</label><input className="input" type="email" {...register('email')} />
          {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}</div>
        <div><label className="label">Contraseña</label><input className="input" type="password" {...register('password')} />
          {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>}</div>
        {error && <p className="text-rose-500 text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={isSubmitting}>Continuar</button>
        <p className="text-sm text-slate-400 text-center">¿Ya tenés cuenta? <Link to="/login" className="text-brand-500">Iniciar sesión</Link></p>
      </form>
    </AuthLayout>
  );
}
