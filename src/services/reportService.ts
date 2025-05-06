
import {
  ReportParams,
  SalesReportData,
  ProductSalesReportData,
  CategorySalesReportData,
  ProfitReportData,
  InventoryReportData,
  CashierPerformanceReportData,
  EmailReportParams
} from '@/types';
import { get, post, ApiResponse } from './api';
import { toast } from '@/components/ui/sonner';

/**
 * Fetches sales report data based on provided parameters
 * @param params Report parameters including date range and format
 * @returns Promise with sales report data
 */
export const getSalesReport = async (params: ReportParams): Promise<SalesReportData> => {
  try {
    const response = await get<SalesReportData>('/reports/sales', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch sales report');
  } catch (error) {
    console.error('Error fetching sales report:', error);
    throw error;
  }
};

/**
 * Fetches product sales report data based on provided parameters
 * @param params Report parameters including date range and format
 * @returns Promise with product sales report data
 */
export const getProductSalesReport = async (params: ReportParams): Promise<ProductSalesReportData> => {
  try {
    const response = await get<ProductSalesReportData>('/reports/products', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch product sales report');
  } catch (error) {
    console.error('Error fetching product sales report:', error);
    throw error;
  }
};

/**
 * Fetches category sales report data based on provided parameters
 * @param params Report parameters including date range and format
 * @returns Promise with category sales report data
 */
export const getCategorySalesReport = async (params: ReportParams): Promise<CategorySalesReportData> => {
  try {
    const response = await get<CategorySalesReportData>('/reports/categories', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch category sales report');
  } catch (error) {
    console.error('Error fetching category sales report:', error);
    throw error;
  }
};

/**
 * Fetches profit and loss report data based on provided parameters
 * @param params Report parameters including date range and format
 * @returns Promise with profit and loss report data
 */
export const getProfitReport = async (params: ReportParams): Promise<ProfitReportData> => {
  try {
    const response = await get<ProfitReportData>('/reports/profit', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch profit report');
  } catch (error) {
    console.error('Error fetching profit report:', error);
    throw error;
  }
};

/**
 * Fetches inventory/stock report data based on provided parameters
 * @param params Report parameters (can include filters like low stock only)
 * @returns Promise with inventory report data
 */
export const getInventoryReport = async (params?: Partial<ReportParams>): Promise<InventoryReportData> => {
  try {
    const response = await get<InventoryReportData>('/reports/inventory', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch inventory report');
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    throw error;
  }
};

/**
 * Fetches cashier performance report data based on provided parameters
 * @param params Report parameters including date range and format
 * @returns Promise with cashier performance report data
 */
export const getCashierPerformanceReport = async (params: ReportParams): Promise<CashierPerformanceReportData> => {
  try {
    const response = await get<CashierPerformanceReportData>('/reports/cashiers', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch cashier performance report');
  } catch (error) {
    console.error('Error fetching cashier performance report:', error);
    throw error;
  }
};

/**
 * Downloads a report in the specified format
 * @param reportType The type of report to download
 * @param params Report parameters including date range and format
 * @returns Promise that resolves when download starts
 */
export const downloadReport = async (
  reportType: 'sales' | 'products' | 'categories' | 'profit' | 'inventory' | 'cashiers',
  params: ReportParams
): Promise<void> => {
  try {
    if (!params.format || params.format === 'json') {
      params.format = 'csv'; // Default to CSV if format is missing or JSON
    }
    
    const response = await get(`/reports/${reportType}/download`, {
      params,
      responseType: 'blob'
    });

    // Create file name based on report type and dates
    const startDate = params.start_date ? params.start_date.replace(/-/g, '') : '';
    const endDate = params.end_date ? params.end_date.replace(/-/g, '') : '';
    const fileName = `${reportType}_report_${startDate}_${endDate}.${params.format}`;
    
    // Create a blob and download it
    const blob = new Blob([response.data], {
      type: getContentType(params.format)
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success(`${capitalizeFirstLetter(reportType)} report downloaded successfully`);
  } catch (error) {
    console.error(`Error downloading ${reportType} report:`, error);
    toast.error(`Failed to download ${reportType} report. Please try again.`);
    throw error;
  }
};

/**
 * Sends a report via email
 * @param reportType The type of report to send
 * @param params Parameters including recipients, subject, message, and report params
 * @returns Promise with email sending result
 */
export const emailReport = async (
  reportType: 'sales' | 'products' | 'categories' | 'profit' | 'inventory' | 'cashiers',
  params: EmailReportParams
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await post<{ success: boolean }>(`/reports/${reportType}/email`, params);
    
    if (response.status) {
      toast.success(`${capitalizeFirstLetter(reportType)} report sent successfully to ${params.recipients.join(', ')}`);
      return response;
    }
    
    throw new Error(response.message || 'Failed to send report via email');
  } catch (error) {
    console.error(`Error sending ${reportType} report via email:`, error);
    toast.error(`Failed to email ${reportType} report. Please try again.`);
    throw error;
  }
};

/**
 * Gets content type based on file format
 * @param format File format
 * @returns Content type string
 */
const getContentType = (format?: string): string => {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Capitalizes the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Export as default object for easier import
export default {
  getSalesReport,
  getProductSalesReport,
  getCategorySalesReport,
  getProfitReport,
  getInventoryReport,
  getCashierPerformanceReport,
  downloadReport,
  emailReport
};
