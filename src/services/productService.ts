
import { Product, Category } from '@/types';
import { get, post, put, del, ApiResponse } from './api';

// Interface for product filters
export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  inStock?: boolean;
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

// Interface for product creation & update
export interface ProductInput {
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
  isActive?: boolean;
}

// Interface for category creation & update
export interface CategoryInput {
  name: string;
  description?: string;
}

// Interface for stock update input
export interface StockUpdateInput {
  quantity: number;
  type: 'add' | 'subtract' | 'set';
  notes?: string;
}

/**
 * Get products with optional filters and pagination
 */
export const getProducts = async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
  try {
    const response = await get<PaginatedResponse<Product>>('/products', { params: filters });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch products');
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (id: string): Promise<Product> => {
  try {
    const response = await get<Product>(`/products/${id}`);
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Product not found');
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new product
 */
export const createProduct = async (productData: ProductInput): Promise<Product> => {
  try {
    const response = await post<Product>('/products', productData);
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to create product');
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (id: string, productData: Partial<ProductInput>): Promise<Product> => {
  try {
    const response = await put<Product>(`/products/${id}`, productData);
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update product');
  } catch (error) {
    console.error(`Error updating product with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const response = await del<{ success: boolean }>(`/products/${id}`);
    
    if (response.status) {
      return true;
    }
    
    throw new Error(response.message || 'Failed to delete product');
  } catch (error) {
    console.error(`Error deleting product with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (categoryId: string, filters?: Omit<ProductFilters, 'categoryId'>): Promise<PaginatedResponse<Product>> => {
  try {
    const params = { ...filters, categoryId };
    const response = await get<PaginatedResponse<Product>>('/products', { params });
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch products by category');
  } catch (error) {
    console.error(`Error fetching products for category ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async (filters?: Omit<ProductFilters, 'inStock'>): Promise<PaginatedResponse<Product>> => {
  try {
    const params = { ...filters, lowStock: true };
    const response = await get<PaginatedResponse<Product>>('/products/low-stock', { params });
    
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
 * Update product stock
 */
export const updateProductStock = async (id: string, stockData: StockUpdateInput): Promise<Product> => {
  try {
    const response = await post<Product>(`/products/${id}/stock`, stockData);
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update product stock');
  } catch (error) {
    console.error(`Error updating stock for product ${id}:`, error);
    throw error;
  }
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await get<Category[]>('/categories');
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch categories');
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Create a new category
 */
export const createCategory = async (categoryData: CategoryInput): Promise<Category> => {
  try {
    const response = await post<Category>('/categories', categoryData);
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to create category');
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (id: string, categoryData: Partial<CategoryInput>): Promise<Category> => {
  try {
    const response = await put<Category>(`/categories/${id}`, categoryData);
    
    if (response.status && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update category');
  } catch (error) {
    console.error(`Error updating category with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const response = await del<{ success: boolean }>(`/categories/${id}`);
    
    if (response.status) {
      return true;
    }
    
    throw new Error(response.message || 'Failed to delete category');
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error);
    throw error;
  }
};

// Export as default object for easier import
export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getLowStockProducts,
  updateProductStock,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
