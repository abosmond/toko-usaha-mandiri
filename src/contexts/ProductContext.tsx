import React, { createContext, useState, useContext, useEffect } from 'react';
import { Product, Category, StockAdjustment, StockAdjustmentType } from '@/types';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface ProductContextType {
  products: Product[];
  categories: Category[];
  stockAdjustments: StockAdjustment[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  searchProducts: (query: string) => Product[];
  getLowStockProducts: () => Product[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  updateStock: (
    productId: string, 
    quantity: number, 
    adjustmentType: StockAdjustmentType, 
    supplierId?: string, 
    notes?: string
  ) => void;
  addStockAdjustment: (
    adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'userName' | 'productName' | 'supplierName'>
  ) => void;
  getStockAdjustments: () => StockAdjustment[];
  getStockAdjustmentsByType: (type: StockAdjustmentType) => StockAdjustment[];
  getStockAdjustmentsByDateRange: (startDate: string, endDate: string) => StockAdjustment[];
  getStockAdjustmentsByProduct: (productId: string) => StockAdjustment[];
  getMonthlyPurchases: () => number;
  getMonthlyLossesReturns: () => number;
}

// Mock data
const mockCategories: Category[] = [
  { id: '1', name: 'Makanan', description: 'Produk makanan' },
  { id: '2', name: 'Minuman', description: 'Produk minuman' },
  { id: '3', name: 'Snack', description: 'Produk camilan' },
  { id: '4', name: 'Alat Tulis', description: 'Peralatan tulis' },
  { id: '5', name: 'Kebutuhan Rumah', description: 'Produk kebutuhan rumah tangga' },
];

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Mie Instan',
    description: 'Mie instan rasa ayam',
    barcode: '8992388111114',
    sku: 'MI001',
    price: 3500,
    cost: 3000,
    categoryId: '1',
    stock: 50,
    lowStockThreshold: 10,
    imageUrl: '/mie-instan.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Air Mineral 600ml',
    description: 'Air mineral kemasan botol 600ml',
    barcode: '8992388222225',
    sku: 'AM001',
    price: 4000,
    cost: 3200,
    categoryId: '2',
    stock: 24,
    lowStockThreshold: 12,
    imageUrl: '/air-mineral.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Keripik Kentang',
    description: 'Keripik kentang rasa original',
    barcode: '8992388333336',
    sku: 'KK001',
    price: 10000,
    cost: 8000,
    categoryId: '3',
    stock: 15,
    lowStockThreshold: 5,
    imageUrl: '/keripik-kentang.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Pulpen',
    description: 'Pulpen hitam',
    barcode: '8992388444447',
    sku: 'PP001',
    price: 2500,
    cost: 1500,
    categoryId: '4',
    stock: 30,
    lowStockThreshold: 10,
    imageUrl: '/pulpen.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Sabun Cuci Piring',
    description: 'Sabun cuci piring cair 800ml',
    barcode: '8992388555558',
    sku: 'SB001',
    price: 15000,
    cost: 12000,
    categoryId: '5',
    stock: 8,
    lowStockThreshold: 5,
    imageUrl: '/sabun-cuci.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Teh Botol 350ml',
    description: 'Teh manis dalam kemasan botol',
    barcode: '8992388666669',
    sku: 'TB001',
    price: 5000,
    cost: 4200,
    categoryId: '2',
    stock: 36,
    lowStockThreshold: 12,
    imageUrl: '/teh-botol.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Buku Tulis',
    description: 'Buku tulis 58 lembar',
    barcode: '8992388777770',
    sku: 'BT001',
    price: 5500,
    cost: 4500,
    categoryId: '4',
    stock: 25,
    lowStockThreshold: 10,
    imageUrl: '/buku-tulis.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Roti Tawar',
    description: 'Roti tawar gandum',
    barcode: '8992388888881',
    sku: 'RT001',
    price: 14000,
    cost: 11000,
    categoryId: '1',
    stock: 4,
    lowStockThreshold: 5,
    imageUrl: '/roti-tawar.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const loadFromStorage = <T extends unknown>(key: string, initialData: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : initialData;
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => 
    loadFromStorage('posProducts', mockProducts)
  );
  
  const [categories, setCategories] = useState<Category[]>(() => 
    loadFromStorage('posCategories', mockCategories)
  );
  
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => 
    loadFromStorage('posStockAdjustments', [])
  );
  
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem('posProducts', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('posCategories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('posStockAdjustments', JSON.stringify(stockAdjustments));
  }, [stockAdjustments]);

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    
    setProducts([...products, newProduct]);
    toast.success(`Produk ${newProduct.name} berhasil ditambahkan`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(product => 
      product.id === id ? { 
        ...product, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      } : product
    ));
    toast.success('Produk berhasil diperbarui');
  };

  const deleteProduct = (id: string) => {
    const productToDelete = products.find(p => p.id === id);
    setProducts(products.filter(product => product.id !== id));
    
    if (productToDelete) {
      toast.success(`Produk ${productToDelete.name} berhasil dihapus`);
    }
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(product => product.categoryId === categoryId && product.isActive);
  };

  const searchProducts = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return products.filter(product => 
      product.isActive && (
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.barcode?.includes(query) ||
        product.sku.toLowerCase().includes(lowercaseQuery)
      )
    );
  };

  const getLowStockProducts = () => {
    return products.filter(product => product.isActive && product.stock <= product.lowStockThreshold);
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
    };
    
    setCategories([...categories, newCategory]);
    toast.success(`Kategori ${newCategory.name} berhasil ditambahkan`);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map(category => 
      category.id === id ? { ...category, ...updates } : category
    ));
    toast.success('Kategori berhasil diperbarui');
  };

  const deleteCategory = (id: string) => {
    // Check if any products use this category
    const productsWithCategory = products.filter(p => p.categoryId === id);
    if (productsWithCategory.length > 0) {
      toast.error('Tidak dapat menghapus kategori yang masih digunakan produk');
      return;
    }
    
    const categoryToDelete = categories.find(c => c.id === id);
    setCategories(categories.filter(category => category.id !== id));
    
    if (categoryToDelete) {
      toast.success(`Kategori ${categoryToDelete.name} berhasil dihapus`);
    }
  };

  const updateStock = (
    productId: string, 
    quantity: number, 
    adjustmentType: StockAdjustmentType, 
    supplierId?: string, 
    notes?: string
  ) => {
    if (!user) {
      toast.error('Pengguna tidak terautentikasi');
      return;
    }

    const product = getProductById(productId);
    if (!product) {
      toast.error('Produk tidak ditemukan');
      return;
    }

    // Check if the adjustment would make stock negative
    if (product.stock + quantity < 0) {
      toast.error('Stok tidak boleh negatif');
      return;
    }

    // Validate adjustment quantity based on type
    if (adjustmentType === 'purchase' && quantity <= 0) {
      toast.error('Jumlah pembelian harus positif');
      return;
    }

    if ((adjustmentType === 'loss' || adjustmentType === 'return') && quantity >= 0) {
      toast.error('Jumlah kehilangan atau retur harus negatif');
      return;
    }

    // Update product stock
    const previousStock = product.stock;
    const newStock = previousStock + quantity;
    
    setProducts(products.map(p => 
      p.id === productId ? { ...p, stock: newStock, updatedAt: new Date().toISOString() } : p
    ));

    // Create stock adjustment record
    addStockAdjustment({
      productId,
      previousStock,
      adjustmentQuantity: quantity,
      newStock,
      adjustmentType,
      supplierId,
      notes,
      userId: user.id
    });
    
    toast.success(`Stok produk ${product.name} berhasil diperbarui`);
  };

  const addStockAdjustment = (adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'userName' | 'productName' | 'supplierName'>) => {
    if (!user) return;
    
    const product = products.find(p => p.id === adjustment.productId);
    if (!product) return;
    
    // Get supplier name if present
    let supplierName;
    if (adjustment.supplierId) {
      // We'd normally fetch this from the supplier context
      // For now just use a placeholder
      supplierName = `Supplier ${adjustment.supplierId}`;
    }
    
    const newAdjustment: StockAdjustment = {
      ...adjustment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      userName: user.name,
      productName: product.name,
      supplierName
    };
    
    setStockAdjustments([...stockAdjustments, newAdjustment]);
  };

  const getStockAdjustments = () => {
    return stockAdjustments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const getStockAdjustmentsByType = (type: StockAdjustmentType) => {
    return getStockAdjustments().filter(adj => adj.adjustmentType === type);
  };

  const getStockAdjustmentsByDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return getStockAdjustments().filter(adj => {
      const date = new Date(adj.createdAt);
      return date >= start && date <= end;
    });
  };

  const getStockAdjustmentsByProduct = (productId: string) => {
    return getStockAdjustments().filter(adj => adj.productId === productId);
  };
  
  const getMonthlyPurchases = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    const purchases = getStockAdjustmentsByDateRange(startOfMonth, endOfMonth)
      .filter(adj => adj.adjustmentType === 'purchase');
    
    return purchases.length;
  };
  
  const getMonthlyLossesReturns = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    const lossesAndReturns = getStockAdjustmentsByDateRange(startOfMonth, endOfMonth)
      .filter(adj => adj.adjustmentType === 'loss' || adj.adjustmentType === 'return');
    
    return lossesAndReturns.length;
  };

  const value = {
    products,
    categories,
    stockAdjustments,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getLowStockProducts,
    addCategory,
    updateCategory,
    deleteCategory,
    updateStock,
    addStockAdjustment,
    getStockAdjustments,
    getStockAdjustmentsByType,
    getStockAdjustmentsByDateRange,
    getStockAdjustmentsByProduct,
    getMonthlyPurchases,
    getMonthlyLossesReturns,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
