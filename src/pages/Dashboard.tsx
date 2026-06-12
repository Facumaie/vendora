import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Kpi from '../components/ui/Kpi';
import { money } from '../lib/utils';
import { DailyStat, watchRange, watchToday } from '../services/stats.service';
import { watchProducts } from '../services/products.service';
import { watchSales } from '../services/sales.service';
import { useAuth } from '../stores/authStore';
import type { Product, Sale } from '../types';

export default function Dashboard() {
  const tenantId = useAuth((s) => s.tenantId)!;
  const [today, setToday] = useState<DailyStat | null>(null);
  const [month, setMonth] = useState<DailyStat[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    const monthStart = new Date(); monthStart.setDate(1);
    const fromKey = monthStart.toISOString().slice(0, 10);
    const u1 = watchToday(tenantId, setToday);
    const u2 = watchRange(tenantId, fromKey, setMonth);
    const u3 = watchProducts(tenantId, setProducts);
    const u4 = watchSales(tenantId, setSales, 8);
    return () => { u1(); u2(); u3(); u4(); };
  }, [tenantId]);

  const monthTotals = useMemo(
    () => month.reduce((a, d) => ({ revenue: a.revenue + d.revenue, profit: a.profit + d.profit, count: a.count + d.salesCount }), { revenue: 0, profit: 0, count: 0 }),
    [month],
  );
  const lowStock = products.filter((p) => p.lowStock);
  const top = useMemo(() => {
    const agg: Record<string, { name: string; qty: number }> = {};
    for (const d of month) for (const [id, tp] of Object.entries(d.topProducts || {})) {
      agg[id] = agg[id] ? { name: tp.name, qty: agg[id].qty + tp.qty } : { name: tp.name, qty: tp.qty };
    }
    return Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [month]);

  const chartData = month.map((d) => ({ day: d.id.slice(8), Ventas: Math.round(d.revenue), Ganancia: Math.round(d.profit) }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Ventas hoy" value={money(today?.revenue || 0)} sub={`${today?.salesCount || 0} operaciones`} />
        <Kpi label="Ganancia hoy" value={money(today?.profit || 0)} accent="text-emerald-500" />
        <Kpi label="Ventas del mes" value={money(monthTotals.revenue)} sub={`${monthTotals.count} operaciones`} />
        <Kpi label="Ganancia del mes" value={money(monthTotals.profit)} accent="text-emerald-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <h2 className="font-bold mb-3">Evolución del mes</h2>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} width={70} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="Ventas" fill="#3380ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ganancia" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">Todavía no hay ventas este mes.</p>}
        </div>

        <div className="card p-4">
          <h2 className="font-bold mb-3">Más vendidos (mes)</h2>
          {top.length ? (
            <ul className="space-y-2 text-sm">
              {top.map((p, i) => (
                <li key={i} className="flex justify-between">
                  <span className="truncate pr-2">{i + 1}. {p.name}</span>
                  <span className="font-semibold">{p.qty} u.</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">Sin datos aún.</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">Bajo stock</h2>
            <span className={`badge ${lowStock.length ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'}`}>{lowStock.length}</span>
          </div>
          {lowStock.length ? (
            <ul className="space-y-2 text-sm">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="text-rose-500 font-semibold">{p.stock} / mín. {p.minStock}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">Todo el stock está sobre el mínimo. ✔</p>}
        </div>

        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">Últimas ventas</h2>
            <Link to="/ventas" className="text-sm text-brand-500">Ver todas</Link>
          </div>
          <ul className="space-y-2 text-sm">
            {sales.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>#{s.number} · {s.userName}</span>
                <span className={`font-semibold ${s.status === 'cancelled' ? 'line-through text-slate-400' : ''}`}>{money(s.total)}</span>
              </li>
            ))}
            {!sales.length && <p className="text-slate-400">Sin ventas registradas.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
