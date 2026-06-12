import { Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'supervisor' | 'operador';
export type Plan = 'inicial' | 'profesional' | 'empresa';

export interface Tenant {
  id: string;
  name: string;
  plan: Plan;
  planLimits: { maxProducts: number; maxUsers: number };
  ownerUid: string;
  active: boolean;
  createdAt: Timestamp;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  internalCode: string;
  barcode: string;
  categoryId: string;
  brand: string;
  description: string;
  imageUrl: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  lowStock: boolean;
  active: boolean;
  searchTokens: string[];
}

export interface Category { id: string; name: string; active: boolean }

export interface SaleItem {
  productId: string;
  name: string;
  barcode: string;
  qty: number;
  costPrice: number;
  salePrice: number;
  discount: number;
  subtotal: number;
  profit: number;
}

export interface Sale {
  id: string;
  number: number;
  date: Timestamp;
  userId: string;
  userName: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago';
  status: 'completed' | 'cancelled';
}

export type MovementType = 'ingreso' | 'venta' | 'ajuste' | 'correccion' | 'inventario' | 'anulacion';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  qty: number;
  previousStock: number;
  newStock: number;
  userId: string;
  userName: string;
  date: Timestamp;
  notes: string;
  saleId?: string;
}

export interface BusinessSettings {
  businessName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxRate: number;
  ticketFooter: string;
}
