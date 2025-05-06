
import { Transaction, CartItem, PaymentMethod, Product } from '@/types';
import { get, post, put, del, ApiResponse } from './api';

// Interface for transaction filters
export interface TransactionFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  cashierId?: string;
  customerId?: string;
}

// Interface for paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  }
}

// Interface for creating a new transaction
export interface TransactionInput {
  items: {
    productId: string;
    quantity: number;
    discount?: number;
  }[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid?: number; // For calculating change when payment method is cash
  cashierId: string;
  customerName?: string;
  customerId?: string;
  notes?: string;
}

// Interface for sales report data
export interface SalesReportData {
  period: string; // Could be a date, week number, or month name
  transactionCount: number;
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
  netSales: number;
}

// Interface for profit/loss report data
export interface ProfitLossReportData extends SalesReportData {
  totalCost: number;
  grossProfit: number;
  profitMargin: number; // As a percentage
}

// Interface for dashboard data
export interface DashboardData {
  todaySales: number;
  todayTransactions: number;
  weekSales: number;
  monthSales: number;
  recentTransactions: Transaction[];
  topProducts: {
    product: Product;
    quantity: number;
    revenue: number;
  }[];
  salesByPaymentMethod: {
    paymentMethod: PaymentMethod;
    count: number;
    total: number;
  }[];
}

// Interface for receipt data
export interface ReceiptData {
  transaction: Transaction;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail?: string;
  businessLogo?: string;
  taxIdentificationNumber?: string;
  footerMessage?: string;
}

/**
 * Get transactions with optional filters and pagination
 */
export const getTransactions = async (filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> => {
  try {
    const response = await get<PaginatedResponse<Transaction>>('/transactions', { params: filters });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch transactions');
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

/**
 * Get a single transaction by ID
 */
export const getTransactionById = async (id: string): Promise<Transaction> => {
  try {
    const response = await get<Transaction>(`/transactions/${id}`);
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Transaction not found');
  } catch (error) {
    console.error(`Error fetching transaction with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new transaction (checkout)
 */
export const createTransaction = async (transactionData: TransactionInput): Promise<Transaction> => {
  try {
    const response = await post<Transaction>('/transactions', transactionData);
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to create transaction');
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

/**
 * Cancel a transaction
 */
export const cancelTransaction = async (id: string, reason?: string): Promise<boolean> => {
  try {
    const response = await put<{ success: boolean }>(`/transactions/${id}/cancel`, { reason });
    
    if (response.status) {
      return true;
    }
    
    throw new Error(response.message || 'Failed to cancel transaction');
  } catch (error) {
    console.error(`Error canceling transaction with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get daily sales report
 */
export const getDailySalesReport = async (startDate: string, endDate?: string): Promise<SalesReportData[]> => {
  try {
    const params = { startDate, endDate: endDate || startDate, groupBy: 'day' };
    const response = await get<SalesReportData[]>('/reports/sales', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch daily sales report');
  } catch (error) {
    console.error('Error fetching daily sales report:', error);
    throw error;
  }
};

/**
 * Get weekly sales report
 */
export const getWeeklySalesReport = async (year: number, month?: number): Promise<SalesReportData[]> => {
  try {
    const params = { year, month, groupBy: 'week' };
    const response = await get<SalesReportData[]>('/reports/sales', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch weekly sales report');
  } catch (error) {
    console.error('Error fetching weekly sales report:', error);
    throw error;
  }
};

/**
 * Get monthly sales report
 */
export const getMonthlySalesReport = async (year: number): Promise<SalesReportData[]> => {
  try {
    const params = { year, groupBy: 'month' };
    const response = await get<SalesReportData[]>('/reports/sales', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch monthly sales report');
  } catch (error) {
    console.error('Error fetching monthly sales report:', error);
    throw error;
  }
};

/**
 * Get profit/loss report
 */
export const getProfitLossReport = async (
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<ProfitLossReportData[]> => {
  try {
    const params = { startDate, endDate, groupBy };
    const response = await get<ProfitLossReportData[]>('/reports/profit-loss', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch profit/loss report');
  } catch (error) {
    console.error('Error fetching profit/loss report:', error);
    throw error;
  }
};

/**
 * Get dashboard data with transaction metrics
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await get<DashboardData>('/dashboard/transactions');
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch dashboard data');
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

/**
 * Export transactions to CSV
 * Returns a Blob that can be used to create a download link
 */
export const exportTransactionsToCSV = async (filters?: TransactionFilters): Promise<Blob> => {
  try {
    // Use axios directly for blob response
    const response = await get<Blob>('/transactions/export/csv', { 
      params: filters,
      responseType: 'blob' 
    });
    
    if (response.status) {
      return response.data as unknown as Blob;
    }
    
    throw new Error('Failed to export transactions');
  } catch (error) {
    console.error('Error exporting transactions to CSV:', error);
    throw error;
  }
};

/**
 * Get transaction receipt as PDF
 * Returns a Blob that can be used to create a download link or open in new window
 */
export const getTransactionReceipt = async (id: string): Promise<Blob> => {
  try {
    const response = await get<Blob>(`/transactions/${id}/receipt`, { 
      responseType: 'blob' 
    });
    
    if (response.status) {
      return response.data as unknown as Blob;
    }
    
    throw new Error('Failed to generate receipt');
  } catch (error) {
    console.error(`Error generating receipt for transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Helper function to initiate download of transaction receipt
 */
export const downloadTransactionReceipt = async (id: string, filename?: string): Promise<void> => {
  try {
    const pdfBlob = await getTransactionReceipt(id);
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `receipt-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    console.error(`Error downloading receipt for transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Helper function to initiate download of exported CSV
 */
export const downloadTransactionsCSV = async (filters?: TransactionFilters, filename?: string): Promise<void> => {
  try {
    const csvBlob = await exportTransactionsToCSV(filters);
    const url = window.URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    console.error('Error downloading transactions CSV:', error);
    throw error;
  }
};

// Export as default object for easier import
export default {
  getTransactions,
  getTransactionById,
  createTransaction,
  cancelTransaction,
  getDailySalesReport,
  getWeeklySalesReport,
  getMonthlySalesReport,
  getProfitLossReport,
  getDashboardData,
  exportTransactionsToCSV,
  getTransactionReceipt,
  downloadTransactionReceipt,
  downloadTransactionsCSV
};
