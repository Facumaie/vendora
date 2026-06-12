import { NavLink, Outlet } from 'react-router-dom';
import { useAuth, can } from '../../stores/authStore';
import { useUI } from '../../stores/uiStore';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦', perm: '' },
  { to: '/pos', label: 'Punto de Venta', icon: '⌁', perm: 'sales:create' },
  { to: '/productos', label: 'Productos', icon: '◳', perm: '' },
  { to: '/stock', label: 'Stock', icon: '⇅', perm: '' },
  { to: '/ventas', label: 'Ventas', icon: '⊟', perm: '' },
  { to: '/reportes', label: 'Reportes', icon: '∿', perm: 'reports:view' },
  { to: '/configuracion', label: 'Configuración', icon: '⚙', perm: '*' },
];

export default function AppShell() {
  const { tenant, profile, role, logout } = useAuth();
  const { dark, toggleDark, sidebarOpen, setSidebar, toast } = useUI();

  const nav = NAV.filter((n) => !n.perm || can(role, n.perm) || n.perm === '');

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-30 h-screen w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="px-5 py-5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white grid place-items-center font-extrabold">V</div>
          <div>
            <div className="font-extrabold tracking-tight">Vendora</div>
            <div className="text-[11px] text-slate-400 -mt-0.5 truncate max-w-[140px]">{tenant?.name}</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              onClick={() => setSidebar(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600/10 text-brand-600 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <span className="w-5 text-center">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-sm">
          <div className="font-semibold truncate">{profile?.displayName || profile?.email}</div>
          <div className="text-xs text-slate-400 capitalize mb-2">{role}</div>
          <div className="flex gap-2">
            <button onClick={toggleDark} className="btn-ghost flex-1 !py-1.5 text-xs">{dark ? '☀ Claro' : '☾ Oscuro'}</button>
            <button onClick={logout} className="btn-ghost flex-1 !py-1.5 text-xs">Salir</button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebar(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebar(true)} className="text-xl">☰</button>
          <span className="font-extrabold">Vendora</span>
        </header>
        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
