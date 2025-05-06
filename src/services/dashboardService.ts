
import { 
  DashboardSummary, 
  DailySalesData, 
  CategorySalesData, 
  TopProductData,
  Product, 
  PaymentMethodSalesData,
  DashboardData
} from '@/types';
import { get, ApiResponse } from './api';

/**
 * Get dashboard summary data (main metrics)
 * @returns Promise with dashboard summary metrics
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const response = await get<DashboardSummary>('/dashboard/summary');
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch dashboard summary');
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

/**
 * Get daily sales data for a specific period
 * @param days Number of days to retrieve (default: 7)
 * @returns Promise with daily sales data
 */
export const getDailySalesData = async (days: number = 7): Promise<DailySalesData[]> => {
  try {
    const response = await get<DailySalesData[]>('/dashboard/daily-sales', {
      params: { days }
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch daily sales data');
  } catch (error) {
    console.error('Error fetching daily sales data:', error);
    throw error;
  }
};

/**
 * Get sales data grouped by product categories
 * @param startDate Optional start date filter (YYYY-MM-DD)
 * @param endDate Optional end date filter (YYYY-MM-DD)
 * @returns Promise with category sales data
 */
export const getCategorySalesData = async (
  startDate?: string,
  endDate?: string
): Promise<CategorySalesData[]> => {
  try {
    const response = await get<CategorySalesData[]>('/dashboard/category-sales', {
      params: { startDate, endDate }
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch category sales data');
  } catch (error) {
    console.error('Error fetching category sales data:', error);
    throw error;
  }
};

/**
 * Get top selling products
 * @param limit Number of top products to retrieve (default: 10)
 * @param startDate Optional start date filter (YYYY-MM-DD)
 * @param endDate Optional end date filter (YYYY-MM-DD)
 * @returns Promise with top products data
 */
export const getTopProducts = async (
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<TopProductData[]> => {
  try {
    const response = await get<TopProductData[]>('/dashboard/top-products', {
      params: { limit, startDate, endDate }
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch top products');
  } catch (error) {
    console.error('Error fetching top products:', error);
    throw error;
  }
};

/**
 * Get products with low stock
 * @param limit Number of products to retrieve (default: 10)
 * @returns Promise with low stock products
 */
export const getLowStockProducts = async (limit: number = 10): Promise<Product[]> => {
  try {
    const response = await get<Product[]>('/dashboard/low-stock-products', {
      params: { limit }
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch low stock products');
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw error;
  }
};

/**
 * Get sales data grouped by payment methods
 * @param startDate Optional start date filter (YYYY-MM-DD)
 * @param endDate Optional end date filter (YYYY-MM-DD)
 * @returns Promise with payment method sales data
 */
export const getPaymentMethodSales = async (
  startDate?: string,
  endDate?: string
): Promise<PaymentMethodSalesData[]> => {
  try {
    const response = await get<PaymentMethodSalesData[]>('/dashboard/payment-method-sales', {
      params: { startDate, endDate }
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch payment method sales');
  } catch (error) {
    console.error('Error fetching payment method sales:', error);
    throw error;
  }
};

/**
 * Get all dashboard data in a single request (optimized)
 * @param startDate Optional global start date filter (YYYY-MM-DD)
 * @param endDate Optional global end date filter (YYYY-MM-DD)
 * @param days Number of days for daily sales data (default: 7)
 * @param topProductsLimit Number of top products to retrieve (default: 5)
 * @param lowStockLimit Number of low stock products to retrieve (default: 5)
 * @returns Promise with complete dashboard data
 */
export const getAllDashboardData = async (
  startDate?: string,
  endDate?: string,
  days: number = 7,
  topProductsLimit: number = 5,
  lowStockLimit: number = 5
): Promise<DashboardData> => {
  try {
    const response = await get<DashboardData>('/dashboard/all', {
      params: {
        startDate,
        endDate,
        days,
        topProductsLimit,
        lowStockLimit
      }
    });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch dashboard data');
  } catch (error) {
    console.error('Error fetching all dashboard data:', error);
    throw error;
  }
};

/**
 * Get year-to-date sales comparison with previous year
 * @returns Promise with year-to-date comparison data
 */
export const getYearToDateComparison = async (): Promise<{
  current_year_sales: number;
  previous_year_sales: number;
  growth_percentage: number;
  current_year_transactions: number;
  previous_year_transactions: number;
  transaction_growth_percentage: number;
}> => {
  try {
    const response = await get<{
      current_year_sales: number;
      previous_year_sales: number;
      growth_percentage: number;
      current_year_transactions: number;
      previous_year_transactions: number;
      transaction_growth_percentage: number;
    }>('/dashboard/ytd-comparison');
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch year-to-date comparison');
  } catch (error) {
    console.error('Error fetching year-to-date comparison:', error);
    throw error;
  }
};

// Export as default object for easier import
export default {
  getDashboardSummary,
  getDailySalesData,
  getCategorySalesData,
  getTopProducts,
  getLowStockProducts,
  getPaymentMethodSales,
  getAllDashboardData,
  getYearToDateComparison
};
