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

// Dashboard interfaces
export interface DashboardSummary {
  total_sales: number;
  total_sales_today: number;
  total_sales_yesterday: number;
  sales_growth_percentage: number;
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_transactions: number;
  transactions_today: number;
  average_transaction_value: number;
}

export interface DailySalesData {
  date: string;
  sales: number;
  transactions: number;
}

export interface CategorySalesData {
  category_id: string;
  category_name: string;
  sales: number;
  percentage: number;
  product_count: number;
}

export interface TopProductData {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  revenue: number;
  profit?: number;
}

export interface PaymentMethodSalesData {
  payment_method: PaymentMethod;
  transactions: number;
  total: number;
  percentage: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  daily_sales: DailySalesData[];
  category_sales: CategorySalesData[];
  top_products: TopProductData[];
  low_stock_products: Product[];
  payment_method_sales: PaymentMethodSalesData[];
}

export interface ReportParams {
  start_date: string;
  end_date: string;
  format?: 'json' | 'csv' | 'pdf' | 'excel';
  group_by?: 'day' | 'week' | 'month';
}

export interface SalesReportData {
  period: string;
  total_sales: number;
  number_of_transactions: number;
  average_transaction: number;
  items_sold: number;
  details: Array<{
    date: string;
    sales: number;
    transactions: number;
    average: number;
    items: number;
  }>;
}

export interface ProductSalesReportData {
  period: string;
  total_sales: number;
  total_products: number;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total_sales: number;
    profit: number;
    profit_margin: number;
  }>;
}

export interface CategorySalesReportData {
  period: string;
  total_sales: number;
  categories: Array<{
    id: string;
    name: string;
    products_count: number;
    quantity_sold: number;
    total_sales: number;
    percentage: number;
  }>;
}

export interface ProfitReportData {
  period: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  profit_margin: number;
  details: Array<{
    date: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
}

export interface InventoryReportData {
  date_generated: string;
  total_products: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    category_name: string;
    stock: number;
    unit_cost: number;
    unit_price: number;
    value: number;
    last_restock_date: string;
  }>;
}

export interface CashierPerformanceReportData {
  period: string;
  cashiers: Array<{
    id: string;
    name: string;
    email: string;
    transactions_count: number;
    total_sales: number;
    average_transaction: number;
    items_sold: number;
    hours_worked?: number;
    sales_per_hour?: number;
  }>;
}

export interface EmailReportParams extends ReportParams {
  recipients: string[];
  subject: string;
  message?: string;
}
