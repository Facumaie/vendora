import { useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DailyStat, watchRange } from '../../services/stats.service';
import { useAuth } from '../../stores/authStore';
import { money, pct, todayKey } from '../../lib/utils';
import ExcelJS from 'exceljs';

const RANGES = [
  { label: '7 días', days: 7 }, { label: '30 días', days: 30 }, { label: '90 días', days: 90 },
];

export default function ReportsPage() {
  const tenantId = useAuth((s) => s.tenantId)!;
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<DailyStat[]>([]);

  useEffect(() => {
    const from = new Date(); from.setDate(from.getDate() - days);
    return watchRange(tenantId, todayKey(from), setStats);
  }, [tenantId, days]);

  const totals = useMemo(
    () => stats.reduce((a, d) => ({ revenue: a.revenue + d.revenue, cost: a.cost + d.cost, profit: a.profit + d.profit, count: a.count + d.salesCount }), { revenue: 0, cost: 0, profit: 0, count: 0 }),
    [stats],
  );
  const rentability = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  const ranking = useMemo(() => {
    const agg: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const d of stats) for (const [id, tp] of Object.entries(d.topProducts || {})) {
      if (!agg[id]) agg[id] = { name: tp.name, qty: 0, revenue: 0 };
      agg[id].qty += tp.qty; agg[id].revenue += tp.revenue;
    }
    return Object.values(agg).sort((a, b) => b.qty - a.qty);
  }, [stats]);

  const chart = stats.map((d) => ({ day: d.id.slice(5), Ventas: Math.round(d.revenue), Ganancia: Math.round(d.profit) }));

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws1 = wb.addWorksheet('Resumen diario');
    ws1.columns = [
      { header: 'Fecha', key: 'id', width: 14 }, { header: 'Ventas', key: 'salesCount', width: 10 },
      { header: 'Facturación', key: 'revenue', width: 14 }, { header: 'Costo', key: 'cost', width: 14 },
      { header: 'Ganancia', key: 'profit', width: 14 },
    ];
    ws1.getRow(1).font = { bold: true };
    stats.forEach((d) => ws1.addRow(d));
    const ws2 = wb.addWorksheet('Productos');
    ws2.columns = [
      { header: 'Producto', key: 'name', width: 36 }, { header: 'Unidades', key: 'qty', width: 12 },
      { header: 'Facturación', key: 'revenue', width: 14 },
    ];
    ws2.getRow(1).font = { bold: true };
    ranking.forEach((r) => ws2.addRow(r));
    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf]));
    const a = document.createElement('a');
    a.href = url; a.download = `vendora-reporte-${todayKey()}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Reportes</h1>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setDays(r.days)}
              className={r.days === days ? 'btn-primary !py-1.5' : 'btn-ghost !py-1.5'}>{r.label}</button>
          ))}
          <button className="btn-ghost !py-1.5" onClick={exportExcel}>⬇ Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-xs text-slate-400 uppercase font-semibold">Facturación</div><div className="text-xl font-extrabold mt-1">{money(totals.revenue)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-400 uppercase font-semibold">Costo</div><div className="text-xl font-extrabold mt-1">{money(totals.cost)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-400 uppercase font-semibold">Ganancia</div><div className="text-xl font-extrabold mt-1 text-emerald-500">{money(totals.profit)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-400 uppercase font-semibold">Rentabilidad</div><div className="text-xl font-extrabold mt-1">{pct(rentability)}</div></div>
      </div>

      <div className="card p-4">
        <h2 className="font-bold mb-3">Evolución</h2>
        {chart.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chart}>
              <XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} width={70} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Line type="monotone" dataKey="Ventas" stroke="#3380ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Ganancia" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-400">Sin datos en el período.</p>}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <RankTable title="Más vendidos" rows={ranking.slice(0, 10)} />
        <RankTable title="Menos vendidos" rows={[...ranking].reverse().slice(0, 10)} />
      </div>
    </div>
  );
}

function RankTable({ title, rows }: { title: string; rows: { name: string; qty: number; revenue: number }[] }) {
  return (
    <div className="card p-4">
      <h2 className="font-bold mb-3">{title}</h2>
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-400 text-left"><tr><th className="py-1">Producto</th><th className="text-right">Unid.</th><th className="text-right">Facturación</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
              <td className="py-1.5 truncate max-w-[200px]">{r.name}</td>
              <td className="text-right font-semibold">{r.qty}</td>
              <td className="text-right">{money(r.revenue)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={3} className="py-4 text-center text-slate-400">Sin datos.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
