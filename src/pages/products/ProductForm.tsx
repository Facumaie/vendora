import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/ui/Modal';
import { saveProduct, uploadProductImage } from '../../services/products.service';
import { useAuth } from '../../stores/authStore';
import { useUI } from '../../stores/uiStore';
import type { Product } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Requerido'),
  internalCode: z.string().default(''),
  barcode: z.string().default(''),
  categoryId: z.string().default(''),
  brand: z.string().default(''),
  description: z.string().default(''),
  costPrice: z.coerce.number().min(0, '≥ 0'),
  salePrice: z.coerce.number().min(0, '≥ 0'),
  stock: z.coerce.number().int().min(0, '≥ 0'),
  minStock: z.coerce.number().int().min(0, '≥ 0'),
});
type Form = z.infer<typeof schema>;

export default function ProductForm({ open, onClose, product, presetBarcode }: {
  open: boolean; onClose: () => void; product?: Product | null; presetBarcode?: string;
}) {
  const tenantId = useAuth((s) => s.tenantId)!;
  const notify = useUI((s) => s.notify);
  const [file, setFile] = useState<File | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    if (!open) return;
    reset(product ? {
      name: product.name, internalCode: product.internalCode, barcode: product.barcode,
      categoryId: product.categoryId, brand: product.brand, description: product.description,
      costPrice: product.costPrice, salePrice: product.salePrice, stock: product.stock, minStock: product.minStock,
    } : { name: '', internalCode: '', barcode: presetBarcode || '', categoryId: '', brand: '', description: '', costPrice: 0, salePrice: 0, stock: 0, minStock: 0 });
    setFile(null);
  }, [open, product, presetBarcode, reset]);

  const onSubmit = async (d: Form) => {
    try {
      let imageUrl = product?.imageUrl || '';
      if (file) imageUrl = await uploadProductImage(tenantId, file);
      await saveProduct(tenantId, { ...d, imageUrl, active: true }, product?.id);
      notify(product ? 'Producto actualizado' : 'Producto creado');
      onClose();
    } catch (e: any) { notify(e.message || 'Error al guardar', 'error'); }
  };

  const margin = (cost: number, sale: number) => (sale > 0 ? (((sale - cost) / sale) * 100).toFixed(1) : '0');

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Editar producto' : 'Nuevo producto'} wide>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><label className="label">Nombre *</label><input className="input" {...register('name')} />
          {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}</div>
        <div><label className="label">Código de barras</label><input className="input" {...register('barcode')} /></div>
        <div><label className="label">Código interno</label><input className="input" {...register('internalCode')} /></div>
        <div><label className="label">Marca</label><input className="input" {...register('brand')} /></div>
        <div><label className="label">Categoría</label><input className="input" {...register('categoryId')} placeholder="bebidas, golosinas…" /></div>
        <div><label className="label">Precio de costo *</label><input className="input" type="number" step="0.01" {...register('costPrice')} /></div>
        <div><label className="label">Precio de venta *</label><input className="input" type="number" step="0.01" {...register('salePrice')} /></div>
        <div><label className="label">Stock actual *</label><input className="input" type="number" {...register('stock')} /></div>
        <div><label className="label">Stock mínimo *</label><input className="input" type="number" {...register('minStock')} /></div>
        <div className="md:col-span-2"><label className="label">Descripción</label><textarea className="input" rows={2} {...register('description')} /></div>
        <div className="md:col-span-2"><label className="label">Imagen</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" /></div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
          <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
