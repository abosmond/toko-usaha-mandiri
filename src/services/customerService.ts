
import { ApiResponse, get, post, put, del } from './api';
import { Customer, Transaction } from '@/types';

// Interface for pagination and search parameters
export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Interface for customer creation and update
export interface CustomerFormData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

// Interface for customer summary
export interface CustomerSummary {
  total_transactions: number;
  total_spent: number;
  average_transaction: number;
  first_transaction_date: string;
  last_transaction_date: string;
  most_purchased_product?: {
    id: string;
    name: string;
    quantity: number;
    total_amount: number;
  };
  purchase_frequency?: string; // e.g. "Weekly", "Monthly", etc.
}

// Interface for customer notes
export interface CustomerNote {
  id: string;
  customer_id: string;
  text: string;
  created_by: string;
  created_at: string;
}

// Interface for customer CSV import response
export interface CustomerImportResult {
  imported_count: number;
  failed_count: number;
  errors?: Array<{
    row: number;
    error: string;
  }>;
}

// Interface for top customers response
export interface TopCustomer extends Customer {
  total_spent: number;
  total_transactions: number;
}

/**
 * Get paginated list of customers with optional search and sorting
 */
export const getCustomers = async (params?: CustomerListParams): Promise<{
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}> => {
  const response = await get<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
  }>('/customers', { params });
  
  return response.data as {
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
  };
};

/**
 * Get a single customer by ID
 */
export const getCustomerById = async (id: string): Promise<Customer> => {
  const response = await get<Customer>(`/customers/${id}`);
  return response.data as Customer;
};

/**
 * Create a new customer
 */
export const createCustomer = async (customerData: CustomerFormData): Promise<Customer> => {
  const response = await post<Customer>('/customers', customerData);
  return response.data as Customer;
};

/**
 * Update an existing customer
 */
export const updateCustomer = async (id: string, customerData: CustomerFormData): Promise<Customer> => {
  const response = await put<Customer>(`/customers/${id}`, customerData);
  return response.data as Customer;
};

/**
 * Delete a customer
 */
export const deleteCustomer = async (id: string): Promise<{ success: boolean }> => {
  const response = await del<{ success: boolean }>(`/customers/${id}`);
  return response.data as { success: boolean };
};

/**
 * Get customer transaction history
 */
export const getCustomerTransactions = async (
  customerId: string,
  params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }
): Promise<{
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}> => {
  const response = await get<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }>(`/customers/${customerId}/transactions`, { params });
  
  return response.data as {
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  };
};

/**
 * Get customer summary data
 */
export const getCustomerSummary = async (customerId: string): Promise<CustomerSummary> => {
  const response = await get<CustomerSummary>(`/customers/${customerId}/summary`);
  return response.data as CustomerSummary;
};

/**
 * Add a note to a customer
 */
export const addCustomerNote = async (
  customerId: string,
  text: string
): Promise<CustomerNote> => {
  const response = await post<CustomerNote>(`/customers/${customerId}/notes`, { text });
  return response.data as CustomerNote;
};

/**
 * Get customer notes
 */
export const getCustomerNotes = async (
  customerId: string,
  params?: {
    page?: number;
    limit?: number;
  }
): Promise<{
  notes: CustomerNote[];
  total: number;
  page: number;
  limit: number;
}> => {
  const response = await get<{
    notes: CustomerNote[];
    total: number;
    page: number;
    limit: number;
  }>(`/customers/${customerId}/notes`, { params });
  
  return response.data as {
    notes: CustomerNote[];
    total: number;
    page: number;
    limit: number;
  };
};

/**
 * Delete a customer note
 */
export const deleteCustomerNote = async (
  customerId: string,
  noteId: string
): Promise<{ success: boolean }> => {
  const response = await del<{ success: boolean }>(`/customers/${customerId}/notes/${noteId}`);
  return response.data as { success: boolean };
};

/**
 * Import customers from CSV file
 */
export const importCustomersFromCSV = async (file: File): Promise<CustomerImportResult> => {
  const formData = new FormData();
  formData.append('csv_file', file);
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  const response = await post<CustomerImportResult>('/customers/import', formData, config);
  return response.data as CustomerImportResult;
};

/**
 * Get export URL for customers
 */
export const getCustomersExportUrl = (format: 'csv' | 'excel' = 'csv', params?: CustomerListParams): string => {
  const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/customers/export`;
  const queryParams = new URLSearchParams();
  
  queryParams.append('format', format);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
};

/**
 * Export customers to CSV or Excel
 */
export const exportCustomers = async (format: 'csv' | 'excel' = 'csv', params?: CustomerListParams): Promise<void> => {
  const exportUrl = getCustomersExportUrl(format, params);
  window.open(exportUrl, '_blank');
};

/**
 * Get top customers by total spent
 */
export const getTopCustomers = async (
  limit: number = 10,
  start_date?: string,
  end_date?: string
): Promise<TopCustomer[]> => {
  const response = await get<TopCustomer[]>('/customers/top', {
    params: {
      limit,
      start_date,
      end_date,
    },
  });
  
  return response.data as TopCustomer[];
};
