import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import { ProtectedRoute, PublicOnly } from './routes/ProtectedRoute';
import { useAuth } from './stores/authStore';
import { useUI } from './stores/uiStore';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import CreateBusiness from './pages/auth/CreateBusiness';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/products/ProductsPage';
import PosPage from './pages/pos/PosPage';
import StockPage from './pages/stock/StockPage';
import SalesPage from './pages/sales/SalesPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import SuperAdminPage from './pages/superadmin/SuperAdminPage';

export default function App() {
  const init = useAuth((s) => s.init);
  const dark = useUI((s) => s.dark);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar" element={<ForgotPassword />} />
        </Route>
        <Route path="/crear-negocio" element={<CreateBusiness />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/ventas" element={<SalesPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="/configuracion" element={<SettingsPage />} />
            <Route path="/superadmin" element={<SuperAdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
