
import { ApiResponse, get, post, put, del } from './api';
import { 
  Supplier, 
  Purchase, 
  PurchaseItem, 
  PurchaseReport, 
  SupplierNote, 
  SupplierImportResult 
} from '@/types';

// Interface for pagination and search parameters
export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  is_active?: boolean;
}

// Interface for supplier creation and update
export interface SupplierFormData {
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
  notes?: string;
}

// Interface for purchase list parameters
export interface PurchaseListParams {
  page?: number;
  limit?: number;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
  payment_status?: 'paid' | 'pending' | 'partial' | 'cancelled';
  received_status?: 'pending' | 'partial' | 'complete';
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Interface for purchase creation and update
export interface PurchaseFormData {
  supplier_id: string;
  reference_number: string;
  purchase_date: string;
  payment_status: 'paid' | 'pending' | 'partial' | 'cancelled';
  received_status: 'pending' | 'partial' | 'complete';
  notes?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_cost: number;
  }>;
}

// Interface for updating purchase status
export interface PurchaseStatusUpdateData {
  payment_status?: 'paid' | 'pending' | 'partial' | 'cancelled';
  received_status?: 'pending' | 'partial' | 'complete';
  paid_amount?: number;
  received_items?: Array<{
    product_id: string;
    received_quantity: number;
  }>;
  notes?: string;
}

/**
 * Get paginated list of suppliers with optional search and sorting
 */
export const getSuppliers = async (params?: SupplierListParams): Promise<{
  suppliers: Supplier[];
  total: number;
  page: number;
  limit: number;
}> => {
  const response = await get<{
    suppliers: Supplier[];
    total: number;
    page: number;
    limit: number;
  }>('/suppliers', { params });
  
  return response.data as {
    suppliers: Supplier[];
    total: number;
    page: number;
    limit: number;
  };
};

/**
 * Get a single supplier by ID
 */
export const getSupplierById = async (id: string): Promise<Supplier> => {
  const response = await get<Supplier>(`/suppliers/${id}`);
  return response.data as Supplier;
};

/**
 * Create a new supplier
 */
export const createSupplier = async (supplierData: SupplierFormData): Promise<Supplier> => {
  const response = await post<Supplier>('/suppliers', supplierData);
  return response.data as Supplier;
};

/**
 * Update an existing supplier
 */
export const updateSupplier = async (id: string, supplierData: SupplierFormData): Promise<Supplier> => {
  const response = await put<Supplier>(`/suppliers/${id}`, supplierData);
  return response.data as Supplier;
};

/**
 * Delete a supplier
 */
export const deleteSupplier = async (id: string): Promise<{ success: boolean }> => {
  const response = await del<{ success: boolean }>(`/suppliers/${id}`);
  return response.data as { success: boolean };
};

/**
 * Toggle supplier active status
 */
export const toggleSupplierStatus = async (
  id: string,
  isActive: boolean
): Promise<Supplier> => {
  const response = await put<Supplier>(`/suppliers/${id}/status`, { is_active: isActive });
  return response.data as Supplier;
};

/**
 * Add a note to a supplier
 */
export const addSupplierNote = async (
  supplierId: string,
  text: string
): Promise<SupplierNote> => {
  const response = await post<SupplierNote>(`/suppliers/${supplierId}/notes`, { text });
  return response.data as SupplierNote;
};

/**
 * Get supplier notes
 */
export const getSupplierNotes = async (
  supplierId: string,
  params?: {
    page?: number;
    limit?: number;
  }
): Promise<{
  notes: SupplierNote[];
  total: number;
  page: number;
  limit: number;
}> => {
  const response = await get<{
    notes: SupplierNote[];
    total: number;
    page: number;
    limit: number;
  }>(`/suppliers/${supplierId}/notes`, { params });
  
  return response.data as {
    notes: SupplierNote[];
    total: number;
    page: number;
    limit: number;
  };
};

/**
 * Delete a supplier note
 */
export const deleteSupplierNote = async (
  supplierId: string,
  noteId: string
): Promise<{ success: boolean }> => {
  const response = await del<{ success: boolean }>(`/suppliers/${supplierId}/notes/${noteId}`);
  return response.data as { success: boolean };
};

/**
 * Import suppliers from CSV file
 */
export const importSuppliersFromCSV = async (file: File): Promise<SupplierImportResult> => {
  const formData = new FormData();
  formData.append('csv_file', file);
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  const response = await post<SupplierImportResult>('/suppliers/import', formData, config);
  return response.data as SupplierImportResult;
};

/**
 * Get export URL for suppliers
 */
export const getSuppliersExportUrl = (format: 'csv' | 'excel' = 'csv', params?: SupplierListParams): string => {
  const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/suppliers/export`;
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
 * Export suppliers to CSV or Excel
 */
export const exportSuppliers = async (format: 'csv' | 'excel' = 'csv', params?: SupplierListParams): Promise<void> => {
  const exportUrl = getSuppliersExportUrl(format, params);
  window.open(exportUrl, '_blank');
};

/**
 * Get paginated list of purchases from a supplier
 */
export const getSupplierPurchases = async (
  supplierId: string,
  params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    payment_status?: 'paid' | 'pending' | 'partial' | 'cancelled';
    received_status?: 'pending' | 'partial' | 'complete';
  }
): Promise<{
  purchases: Purchase[];
  total: number;
  page: number;
  limit: number;
}> => {
  const response = await get<{
    purchases: Purchase[];
    total: number;
    page: number;
    limit: number;
  }>(`/suppliers/${supplierId}/purchases`, { params });
  
  return response.data as {
    purchases: Purchase[];
    total: number;
    page: number;
    limit: number;
  };
};

/**
 * Get all purchases with pagination and filtering
 */
export const getPurchases = async (params?: PurchaseListParams): Promise<{
  purchases: Purchase[];
  total: number;
  page: number;
  limit: number;
}> => {
  const response = await get<{
    purchases: Purchase[];
    total: number;
    page: number;
    limit: number;
  }>('/purchases', { params });
  
  return response.data as {
    purchases: Purchase[];
    total: number;
    page: number;
    limit: number;
  };
};

/**
 * Get a single purchase by ID
 */
export const getPurchaseById = async (id: string): Promise<Purchase> => {
  const response = await get<Purchase>(`/purchases/${id}`);
  return response.data as Purchase;
};

/**
 * Create a new purchase
 */
export const createPurchase = async (purchaseData: PurchaseFormData): Promise<Purchase> => {
  const response = await post<Purchase>('/purchases', purchaseData);
  return response.data as Purchase;
};

/**
 * Update an existing purchase
 */
export const updatePurchase = async (id: string, purchaseData: PurchaseFormData): Promise<Purchase> => {
  const response = await put<Purchase>(`/purchases/${id}`, purchaseData);
  return response.data as Purchase;
};

/**
 * Update purchase status (payment or receiving)
 */
export const updatePurchaseStatus = async (
  id: string,
  statusData: PurchaseStatusUpdateData
): Promise<Purchase> => {
  const response = await put<Purchase>(`/purchases/${id}/status`, statusData);
  return response.data as Purchase;
};

/**
 * Cancel a purchase
 */
export const cancelPurchase = async (id: string, reason?: string): Promise<Purchase> => {
  const response = await put<Purchase>(`/purchases/${id}/cancel`, { reason });
  return response.data as Purchase;
};

/**
 * Get purchases report by supplier
 */
export const getSupplierPurchasesReport = async (
  supplierId: string,
  params?: {
    start_date?: string;
    end_date?: string;
    format?: 'json' | 'csv' | 'pdf' | 'excel';
  }
): Promise<PurchaseReport> => {
  const response = await get<PurchaseReport>(`/suppliers/${supplierId}/reports/purchases`, { params });
  return response.data as PurchaseReport;
};

/**
 * Download supplier purchases report
 */
export const downloadSupplierPurchasesReport = async (
  supplierId: string,
  format: 'csv' | 'pdf' | 'excel',
  startDate?: string,
  endDate?: string
): Promise<void> => {
  const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/suppliers/${supplierId}/reports/purchases/download`;
  const queryParams = new URLSearchParams();
  
  queryParams.append('format', format);
  
  if (startDate) {
    queryParams.append('start_date', startDate);
  }
  
  if (endDate) {
    queryParams.append('end_date', endDate);
  }
  
  const downloadUrl = `${baseUrl}?${queryParams.toString()}`;
  window.open(downloadUrl, '_blank');
};

// Export as default object for easier import
export default {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  addSupplierNote,
  getSupplierNotes,
  deleteSupplierNote,
  importSuppliersFromCSV,
  exportSuppliers,
  getSupplierPurchases,
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  updatePurchaseStatus,
  cancelPurchase,
  getSupplierPurchasesReport,
  downloadSupplierPurchasesReport
};
