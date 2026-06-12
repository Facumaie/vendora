import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { watchProducts } from '../../services/products.service';
import { registerMovement, watchMovements } from '../../services/stock.service';
import { can, useAuth } from '../../stores/authStore';
import { useUI } from '../../stores/uiStore';
import type { MovementType, Product, StockMovement } from '../../types';

const TYPE_LABEL: Record<string, string> = {
  ingreso: 'Ingreso', venta: 'Venta', ajuste: 'Ajuste', correccion: 'Corrección', inventario: 'Inventario', anulacion: 'Anulación',
};

export default function StockPage() {
  const { tenantId, fbUser, profile, role } = useAuth();
  const notify = useUI((s) => s.notify);
  const [products, setProducts] = useState<Product[]>([]);
  const [movs, setMovs] = useState<StockMovement[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'ingreso' as MovementType, qty: 0, notes: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const u1 = watchProducts(tenantId!, setProducts);
    const u2 = watchMovements(tenantId!, setMovs);
    return () => { u1(); u2(); };
  }, [tenantId]);

  const submit = async () => {
    if (!form.productId) return notify('Elegí un producto', 'error');
    setBusy(true);
    try {
      const signed = form.type === 'ajuste' || form.type === 'correccion' ? form.qty
        : form.type === 'inventario' ? form.qty : Math.abs(form.qty);
      await registerMovement(tenantId!, { uid: fbUser!.uid, name: profile?.displayName || '' }, form.productId, form.type, signed, form.notes);
      notify('Movimiento registrado'); setOpen(false);
      setForm({ productId: '', type: 'ingreso', qty: 0, notes: '' });
    } catch (e: any) { notify(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Stock</h1>
        {can(role, 'stock:write') && <button className="btn-primary" onClick={() => setOpen(true)}>+ Movimiento</button>}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr><th className="p-3">Fecha</th><th className="p-3">Producto</th><th className="p-3">Tipo</th>
              <th className="p-3 text-right">Cant.</th><th className="p-3 text-right">Stock</th><th className="p-3">Usuario</th><th className="p-3">Obs.</th></tr>
          </thead>
          <tbody>
            {movs.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800/60">
                <td className="p-3 whitespace-nowrap text-xs">{m.date?.toDate?.().toLocaleString('es-AR') || '—'}</td>
                <td className="p-3">{m.productName}</td>
                <td className="p-3"><span className="badge bg-slate-500/10 text-slate-500">{TYPE_LABEL[m.type] || m.type}</span></td>
                <td className={`p-3 text-right font-semibold ${m.qty < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{m.qty > 0 ? `+${m.qty}` : m.qty}</td>
                <td className="p-3 text-right">{m.previousStock} → <b>{m.newStock}</b></td>
                <td className="p-3 text-xs">{m.userName}</td>
                <td className="p-3 text-xs text-slate-400">{m.notes}</td>
              </tr>
            ))}
            {!movs.length && <tr><td colSpan={7} className="p-6 text-center text-slate-400">Sin movimientos.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar movimiento">
        <div className="space-y-3">
          <div><label className="label">Producto</label>
            <select className="input" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Elegir…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>)}
            </select></div>
          <div><label className="label">Tipo</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MovementType })}>
              <option value="ingreso">Ingreso de mercadería (+)</option>
              <option value="ajuste">Ajuste manual (±)</option>
              <option value="correccion">Corrección (±)</option>
              <option value="inventario">Inventario (stock final)</option>
            </select></div>
          <div><label className="label">{form.type === 'inventario' ? 'Stock contado' : 'Cantidad (usar negativo para restar)'}</label>
            <input className="input" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: +e.target.value })} /></div>
          <div><label className="label">Observaciones</label>
            <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <button className="btn-primary w-full" disabled={busy} onClick={submit}>{busy ? 'Guardando…' : 'Registrar'}</button>
        </div>
      </Modal>
    </div>
  );
}
