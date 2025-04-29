
export type UserRole = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  barcode?: string;
  sku: string;
  price: number;
  cost?: number;
  categoryId: string;
  stock: number;
  lowStockThreshold: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount?: number;
}

export type PaymentMethod = 'cash' | 'card' | 'e-wallet';

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod: PaymentMethod;
  change?: number;
  cashierId: string;
  customerName?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: 'in' | 'out';
  note?: string;
  userId: string;
  createdAt: string;
}

export interface SalesReport {
  date: string;
  totalSales: number;
  totalItems: number;
  transactions: number;
}

export interface StockReport {
  lowStock: Product[];
  outOfStock: Product[];
}
