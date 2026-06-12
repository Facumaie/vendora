import { useCallback, useEffect, useRef, useState } from 'react';
import { findByBarcode, watchProducts } from '../../services/products.service';
import { createSale } from '../../services/sales.service';
import { cartTotals, useCart } from '../../stores/cartStore';
import { useAuth } from '../../stores/authStore';
import { useUI } from '../../stores/uiStore';
import { useCameraScanner, useUsbScanner } from '../../hooks/useBarcodeScanner';
import { money } from '../../lib/utils';
import ProductForm from '../products/ProductForm';
import { ticketPdf } from './ticket';
import type { Product, Sale } from '../../types';

export default function PosPage() {
  const { tenantId, fbUser, profile } = useAuth();
  const notify = useUI((s) => s.notify);
  const cart = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState<Sale['paymentMethod']>('efectivo');
  const [newBarcode, setNewBarcode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => watchProducts(tenantId!, setProducts), [tenantId]);

  const handleScan = useCallback(async (code: string) => {
    const p = await findByBarcode(tenantId!, code);
    if (p) { cart.add(p); notify(`+ ${p.name}`); }
    else setNewBarcode(code);
  }, [tenantId]);

  useUsbScanner(handleScan);
  const cam = useCameraScanner(handleScan);

  const totals = cartTotals(cart.lines, cart.globalDiscount);
  const suggestions = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)).slice(0, 6)
    : [];

  const confirm = async () => {
    setBusy(true);
    try {
      const res = await createSale(tenantId!, { uid: fbUser!.uid, name: profile?.displayName || fbUser!.email || '' }, cart.lines, cart.globalDiscount, payment);
      ticketPdf(res.number, cart.lines, totals, payment);
      cart.clear();
      notify(`Venta #${res.number} registrada ✔`);
    } catch (e: any) { notify(e.message || 'Error al registrar la venta', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      {/* Búsqueda y escáner */}
      <div className="lg:col-span-3 space-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Punto de Venta</h1>
        <div className="card p-4 space-y-3">
          <div className="flex gap-2">
            <input
              ref={searchRef} className="input" placeholder="Buscar producto o escanear código… (lector USB activo)"
              value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && search.trim()) {
                  if (/^\d{6,}$/.test(search.trim())) { await handleScan(search.trim()); setSearch(''); }
                  else if (suggestions[0]) { cart.add(suggestions[0]); setSearch(''); }
                }
              }}
            />
            {!cam.active
              ? <button className="btn-ghost whitespace-nowrap" onClick={cam.start}>📷 Cámara</button>
              : <button className="btn-danger whitespace-nowrap" onClick={cam.stop}>Detener</button>}
          </div>
          {cam.error && <p className="text-rose-500 text-sm">{cam.error}</p>}
          <video ref={cam.videoRef} className={`w-full rounded-lg ${cam.active ? '' : 'hidden'}`} />
          {suggestions.length > 0 && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {suggestions.map((p) => (
                <li key={p.id} className="py-2 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded"
                    onClick={() => { cart.add(p); setSearch(''); searchRef.current?.focus(); }}>
                  <span>{p.name} <span className="text-slate-400 text-xs">stock {p.stock}</span></span>
                  <span className="font-semibold">{money(p.salePrice)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Carrito */}
      <div className="lg:col-span-2">
        <div className="card p-4 space-y-3 sticky top-4">
          <h2 className="font-bold">Carrito ({cart.lines.length})</h2>
          <div className="space-y-2 max-h-72 overflow-auto">
            {cart.lines.map((l) => (
              <div key={l.product.id} className="text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex justify-between font-semibold">
                  <span className="truncate pr-2">{l.product.name}</span>
                  <button className="text-rose-500" onClick={() => cart.remove(l.product.id)}>✕</button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" min={1} className="input !w-16 !py-1" value={l.qty}
                         onChange={(e) => cart.setQty(l.product.id, +e.target.value)} />
                  <span className="text-xs text-slate-400">× {money(l.product.salePrice)}</span>
                  <input type="number" min={0} max={100} className="input !w-16 !py-1 ml-auto" value={l.discount}
                         onChange={(e) => cart.setDiscount(l.product.id, +e.target.value)} title="Descuento %" />
                  <span className="text-xs text-slate-400">% desc.</span>
                </div>
              </div>
            ))}
            {!cart.lines.length && <p className="text-sm text-slate-400">Escaneá o buscá productos para empezar.</p>}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Descuento global</span>
            <input type="number" min={0} max={100} className="input !w-20 !py-1" value={cart.globalDiscount}
                   onChange={(e) => cart.setGlobalDiscount(+e.target.value)} /> %
          </div>

          <select className="input" value={payment} onChange={(e) => setPayment(e.target.value as Sale['paymentMethod'])}>
            <option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option><option value="mercadopago">Mercado Pago</option>
          </select>

          <div className="text-sm space-y-1 border-t border-slate-200 dark:border-slate-800 pt-2">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
            <div className="flex justify-between text-slate-400"><span>Descuentos</span><span>-{money(totals.discountTotal)}</span></div>
            <div className="flex justify-between text-xl font-extrabold"><span>Total</span><span>{money(totals.total)}</span></div>
            <div className="flex justify-between text-emerald-500 text-xs font-semibold"><span>Ganancia estimada</span><span>{money(totals.profit)}</span></div>
          </div>

          <button className="btn-primary w-full !py-3 text-base" disabled={!cart.lines.length || busy} onClick={confirm}>
            {busy ? 'Registrando…' : 'Confirmar venta'}
          </button>
        </div>
      </div>

      <ProductForm open={!!newBarcode} onClose={() => setNewBarcode(null)} presetBarcode={newBarcode || ''} />
    </div>
  );
}
