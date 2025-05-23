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
  contactName?: string; // Note: Changed from contact_name to match existing convention
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string; // Note: Changed from created_at to match existing convention
  updatedAt: string; // Note: Changed from updated_at to match existing convention
  isActive?: boolean; // Note: Changed from is_active to match existing convention
  notes?: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  supplierId: string; // Note: Changed from supplier_id to match existing convention
  supplierName?: string;
  referenceNumber: string; // Note: Changed from reference_number to match existing convention
  purchaseDate: string; // Note: Changed from purchase_date to match existing convention
  totalAmount: number; // Note: Changed from total_amount to match existing convention
  paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled'; // Note: Changed from payment_status to match existing convention
  receivedStatus: 'pending' | 'partial' | 'complete'; // Note: Changed from received_status to match existing convention
  createdAt?: string;
  updatedAt?: string;
  items: PurchaseItem[];
}

export interface PurchaseReport {
  period: string;
  totalPurchases: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  supplierName: string;
  purchases: Purchase[];
}

export interface SupplierNote {
  id: string;
  supplierId: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

export interface SupplierImportResult {
  importedCount: number;
  failedCount: number;
  errors?: Array<{
    row: number;
    error: string;
  }>;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;  // Note: Changed from created_at to match existing convention
  updatedAt: string;  // Note: Changed from updated_at to match existing convention
  total_transactions?: number;
  total_spent?: number;
  last_transaction_date?: string;
  notes?: string;
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

// Settings interfaces
export interface StoreSettings {
  id?: string;
  store_name: string;
  address: string;
  phone: string;
  email: string;
  tax_percentage: number;
  receipt_footer: string;
  currency: string;
  logo_path?: string;
  updated_at?: string;
}

export interface AppSettings {
  id?: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  date_format: string;
  default_currency_format: string;
  low_stock_threshold_default: number;
  notifications_enabled: boolean;
  auto_print_receipt: boolean;
  receipt_print_format: 'thermal_58mm' | 'thermal_80mm' | 'a4';
  updated_at?: string;
}

export interface UserPreference {
  id?: string;
  user_id: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications_enabled?: boolean;
  dashboard_layout?: Record<string, unknown>;
  updated_at?: string;
}

export interface DatabaseBackup {
  id: string;
  filename: string;
  size_bytes: number;
  created_at: string;
  created_by_user_id: string;
  created_by_user_name: string;
  notes?: string;
  backup_type: 'manual' | 'automatic';
  status: 'completed' | 'processing' | 'failed';
  download_url?: string;
}
