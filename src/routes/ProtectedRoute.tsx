import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../stores/authStore';

export function ProtectedRoute() {
  const { initialized, fbUser, needsBusiness } = useAuth();
  if (!initialized)
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-pulse text-brand-500 font-bold text-xl">Vendora</div>
      </div>
    );
  if (!fbUser) return <Navigate to="/login" replace />;
  if (needsBusiness) return <Navigate to="/crear-negocio" replace />;
  return <Outlet />;
}

export function PublicOnly() {
  const { initialized, fbUser, needsBusiness } = useAuth();
  if (!initialized) return null;
  if (fbUser && !needsBusiness) return <Navigate to="/" replace />;
  if (fbUser && needsBusiness) return <Navigate to="/crear-negocio" replace />;
  return <Outlet />;
}
