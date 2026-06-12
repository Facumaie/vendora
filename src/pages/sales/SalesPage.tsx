import { useEffect, useState } from 'react';
import { cancelSale, watchSales } from '../../services/sales.service';
import { registerMovement } from '../../services/stock.service';
import { can, useAuth } from '../../stores/authStore';
import { useUI } from '../../stores/uiStore';
import { money } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import type { Sale } from '../../types';

export default function SalesPage() {
  const { tenantId, role, fbUser, profile } = useAuth();
  const notify = useUI((s) => s.notify);
  const [sales, setSales] = useState<Sale[]>([]);
  const [detail, setDetail] = useState<Sale | null>(null);

  useEffect(() => watchSales(tenantId!, setSales), [tenantId]);

  const doCancel = async (s: Sale) => {
    if (!confirm(`¿Anular la venta #${s.number}? Se devuelve el stock.`)) return;
    try {
      await cancelSale(tenantId!, s.id);
      for (const it of s.items) {
        await registerMovement(tenantId!, { uid: fbUser!.uid, name: profile?.displayName || '' }, it.productId, 'anulacion', it.qty, `Anulación venta #${s.number}`);
      }
      notify('Venta anulada y stock repuesto');
      setDetail(null);
    } catch (e: any) { notify(e.message, 'error'); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Ventas</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr><th className="p-3">#</th><th className="p-3">Fecha</th><th className="p-3">Usuario</th><th className="p-3">Pago</th>
              <th className="p-3 text-right">Total</th><th className="p-3 text-right">Ganancia</th><th className="p-3">Estado</th></tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => setDetail(s)}>
                <td className="p-3 font-semibold">#{s.number}</td>
                <td className="p-3 text-xs">{s.date?.toDate?.().toLocaleString('es-AR')}</td>
                <td className="p-3">{s.userName}</td>
                <td className="p-3 capitalize text-xs">{s.paymentMethod}</td>
                <td className="p-3 text-right font-semibold">{money(s.total)}</td>
                <td className="p-3 text-right text-emerald-600">{money(s.totalProfit)}</td>
                <td className="p-3">
                  <span className={`badge ${s.status === 'completed' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-500'}`}>
                    {s.status === 'completed' ? 'OK' : 'Anulada'}
                  </span>
                </td>
              </tr>
            ))}
            {!sales.length && <tr><td colSpan={7} className="p-6 text-center text-slate-400">Sin ventas.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Venta #${detail?.number}`} wide>
        {detail && (
          <div className="space-y-3 text-sm">
            <table className="w-full">
              <thead className="text-xs text-slate-400 text-left"><tr><th className="py-1">Producto</th><th className="text-right">Cant.</th><th className="text-right">Subtotal</th><th className="text-right">Ganancia</th></tr></thead>
              <tbody>
                {detail.items.map((it, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5">{it.name}</td><td className="text-right">{it.qty}</td>
                    <td className="text-right">{money(it.subtotal)}</td><td className="text-right text-emerald-600">{money(it.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between font-bold text-base border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Total</span><span>{money(detail.total)}</span>
            </div>
            {detail.status === 'completed' && can(role, 'sales:cancel') && (
              <button className="btn-danger w-full" onClick={() => doCancel(detail)}>Anular venta</button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
