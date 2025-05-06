export type UserRole = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  customerId?: string;
  createdAt: string;
}

export type StockAdjustmentType = 'purchase' | 'loss' | 'correction' | 'return';

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  adjustmentQuantity: number;
  newStock: number;
  adjustmentType: StockAdjustmentType;
  supplierId?: string;
  supplierName?: string;
  notes?: string;
  userId: string;
  userName: string;
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

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
