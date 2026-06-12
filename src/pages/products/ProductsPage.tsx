import { useEffect, useMemo, useState } from 'react';
import { deactivateProduct, watchProducts } from '../../services/products.service';
import { can, useAuth } from '../../stores/authStore';
import { useUI } from '../../stores/uiStore';
import { money } from '../../lib/utils';
import type { Product } from '../../types';
import ProductForm from './ProductForm';

export default function ProductsPage() {
  const { tenantId, role } = useAuth();
  const notify = useUI((s) => s.notify);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => watchProducts(tenantId!, setProducts), [tenantId]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return products.filter((p) =>
      (!onlyLow || p.lowStock) &&
      (!s || p.name.toLowerCase().includes(s) || p.barcode.includes(s) || p.internalCode.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s)),
    );
  }, [products, search, onlyLow]);

  const writable = can(role, 'products:write');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Productos <span className="text-slate-400 text-base font-medium">({products.length})</span></h1>
        {writable && <button className="btn-primary" onClick={() => { setEditing(null); setOpenForm(true); }}>+ Nuevo producto</button>}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input className="input max-w-xs" placeholder="Buscar por nombre, código, marca…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="text-sm flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Solo bajo stock
        </label>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3">Producto</th><th className="p-3">Código</th><th className="p-3 text-right">Costo</th>
              <th className="p-3 text-right">Venta</th><th className="p-3 text-right">Margen</th><th className="p-3 text-right">Stock</th>
              {writable && <th className="p-3"></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const margin = p.salePrice > 0 ? ((p.salePrice - p.costPrice) / p.salePrice) * 100 : 0;
              return (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.brand} {p.categoryId && `· ${p.categoryId}`}</div>
                  </td>
                  <td className="p-3 font-mono text-xs">{p.barcode || p.internalCode || '—'}</td>
                  <td className="p-3 text-right">{money(p.costPrice)}</td>
                  <td className="p-3 text-right font-semibold">{money(p.salePrice)}</td>
                  <td className="p-3 text-right">{margin.toFixed(0)}%</td>
                  <td className="p-3 text-right">
                    <span className={`badge ${p.lowStock ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-600'}`}>{p.stock}</span>
                  </td>
                  {writable && (
                    <td className="p-3 text-right whitespace-nowrap">
                      <button className="text-brand-500 hover:underline mr-3" onClick={() => { setEditing(p); setOpenForm(true); }}>Editar</button>
                      <button className="text-rose-500 hover:underline" onClick={async () => {
                        if (confirm(`¿Dar de baja "${p.name}"?`)) { await deactivateProduct(tenantId!, p.id); notify('Producto dado de baja'); }
                      }}>Baja</button>
                    </td>
                  )}
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={7} className="p-6 text-center text-slate-400">Sin resultados.</td></tr>}
          </tbody>
        </table>
      </div>

      <ProductForm open={openForm} onClose={() => setOpenForm(false)} product={editing} />
    </div>
  );
}
