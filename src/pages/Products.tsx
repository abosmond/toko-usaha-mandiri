
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import { useProducts } from '@/contexts/ProductContext';
import { Product, Category } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search,
  Plus,
  Trash2,
  Edit,
  Box,
  Package
} from "lucide-react";
import { toast } from "sonner";

const Products = () => {
  const navigate = useNavigate();
  const { 
    products, 
    categories, 
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    getLowStockProducts
  } = useProducts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    barcode: '',
    sku: '',
    price: 0,
    cost: 0,
    categoryId: '',
    stock: 0,
    lowStockThreshold: 0,
    isActive: true,
  });
  
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: '',
    description: '',
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string, type: 'product' | 'category', name: string } | null>(null);
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchQuery))
  );
  
  // Filter categories based on search query
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setProductForm({ ...product });
      setEditingId(product.id);
    } else {
      setProductForm({
        name: '',
        description: '',
        barcode: '',
        sku: '',
        price: 0,
        cost: 0,
        categoryId: categories.length > 0 ? categories[0].id : '',
        stock: 0,
        lowStockThreshold: 0,
        isActive: true,
      });
      setEditingId(null);
    }
    setIsProductDialogOpen(true);
  };
  
  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setCategoryForm({ ...category });
      setEditingId(category.id);
    } else {
      setCategoryForm({
        name: '',
        description: '',
      });
      setEditingId(null);
    }
    setIsCategoryDialogOpen(true);
  };
  
  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.sku || !productForm.categoryId) {
      alert('Harap isi semua field yang diperlukan.');
      return;
    }
    
    if (editingId) {
      updateProduct(editingId, productForm);
    } else {
      addProduct(productForm as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
    }
    
    setIsProductDialogOpen(false);
  };
  
  const handleSaveCategory = () => {
    if (!categoryForm.name) {
      alert('Harap isi nama kategori.');
      return;
    }
    
    if (editingId) {
      updateCategory(editingId, categoryForm);
    } else {
      addCategory(categoryForm as Omit<Category, 'id'>);
    }
    
    setIsCategoryDialogOpen(false);
  };
  
  const handleDelete = () => {
    if (!deleteItem) return;
    
    if (deleteItem.type === 'product') {
      deleteProduct(deleteItem.id);
    } else {
      deleteCategory(deleteItem.id);
    }
    
    setIsDeleteDialogOpen(false);
    setDeleteItem(null);
  };

  const handleStockManagement = (productId?: string) => {
    if (productId) {
      // For future implementation: We could add a query parameter to pre-select a product
      // navigate(`/stock?product=${productId}`);
      toast.info("Anda akan dialihkan ke halaman manajemen stok");
    }
    navigate('/stock');
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Manajemen Produk</h1>
          
          <div className="flex gap-2">
            {activeTab === 'products' && (
              <>
                <Button onClick={() => handleOpenProductDialog()}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                </Button>
                <Button variant="outline" onClick={() => handleStockManagement()}>
                  <Package className="mr-2 h-4 w-4" /> Kelola Stok
                </Button>
              </>
            )}
            
            {activeTab === 'categories' && (
              <Button onClick={() => handleOpenCategoryDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder={`Cari ${activeTab === 'products' ? 'produk' : 'kategori'}...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="products" value={activeTab} onValueChange={(value) => setActiveTab(value as 'products' | 'categories')}>
          <TabsList className="mb-4">
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="py-3 px-4 text-left">Nama</th>
                      <th className="py-3 px-4 text-left">SKU</th>
                      <th className="py-3 px-4 text-left">Kategori</th>
                      <th className="py-3 px-4 text-left">Harga</th>
                      <th className="py-3 px-4 text-left">Stok</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => {
                        // Find the category name
                        const category = categories.find(c => c.id === product.categoryId);
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">{product.name}</td>
                            <td className="py-3 px-4">{product.sku}</td>
                            <td className="py-3 px-4">{category?.name || 'Unknown'}</td>
                            <td className="py-3 px-4">Rp {product.price.toLocaleString('id-ID')}</td>
                            <td className="py-3 px-4" onClick={() => handleStockManagement(product.id)}>
                              <span className={`
                                cursor-pointer hover:underline
                                ${product.stock <= product.lowStockThreshold
                                  ? 'text-red-500 font-medium'
                                  : ''
                                }
                              `}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.isActive ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleOpenProductDialog(product)}
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    setDeleteItem({
                                      id: product.id,
                                      type: 'product',
                                      name: product.name
                                    });
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-gray-500">
                          <Box className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                          <p>Tidak ada produk yang ditemukan.</p>
                          <Button 
                            variant="link"
                            onClick={() => handleOpenProductDialog()}
                            className="mt-2"
                          >
                            Tambah produk baru
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="py-3 px-4 text-left">Nama</th>
                      <th className="py-3 px-4 text-left">Deskripsi</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">{category.name}</td>
                          <td className="py-3 px-4">{category.description}</td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenCategoryDialog(category)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setDeleteItem({
                                    id: category.id,
                                    type: 'category',
                                    name: category.name
                                  });
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500">
                          <Box className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                          <p>Tidak ada kategori yang ditemukan.</p>
                          <Button 
                            variant="link"
                            onClick={() => handleOpenCategoryDialog()}
                            className="mt-2"
                          >
                            Tambah kategori baru
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nama Produk *</Label>
              <Input 
                id="product-name" 
                placeholder="Masukkan nama produk" 
                value={productForm.name || ''}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-desc">Deskripsi</Label>
              <Input 
                id="product-desc" 
                placeholder="Masukkan deskripsi produk" 
                value={productForm.description || ''}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-sku">SKU *</Label>
                <Input 
                  id="product-sku" 
                  placeholder="Masukkan SKU" 
                  value={productForm.sku || ''}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-barcode">Barcode</Label>
                <Input 
                  id="product-barcode" 
                  placeholder="Masukkan barcode" 
                  value={productForm.barcode || ''}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-category">Kategori *</Label>
              <Select 
                value={productForm.categoryId || ''} 
                onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Harga Jual *</Label>
                <Input 
                  id="product-price" 
                  type="number"
                  placeholder="0" 
                  value={productForm.price || ''}
                  onChange={(e) => setProductForm({ 
                    ...productForm, 
                    price: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-cost">Harga Modal</Label>
                <Input 
                  id="product-cost" 
                  type="number"
                  placeholder="0" 
                  value={productForm.cost || ''}
                  onChange={(e) => setProductForm({ 
                    ...productForm, 
                    cost: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {!editingId && (
                <div className="space-y-2">
                  <Label htmlFor="product-stock">Stok Awal *</Label>
                  <Input 
                    id="product-stock" 
                    type="number"
                    placeholder="0" 
                    value={productForm.stock || ''}
                    onChange={(e) => setProductForm({ 
                      ...productForm, 
                      stock: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              )}
              
              {editingId && (
                <div className="space-y-2">
                  <Label htmlFor="product-stock">Stok Saat Ini</Label>
                  <div className="flex items-center">
                    <Input 
                      id="product-stock" 
                      type="number"
                      placeholder="0" 
                      value={productForm.stock || ''}
                      readOnly
                      className="bg-gray-100"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-2"
                      onClick={() => {
                        setIsProductDialogOpen(false);
                        handleStockManagement(editingId);
                      }}
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Untuk mengubah stok, gunakan halaman manajemen stok
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="product-threshold">Ambang Batas Stok *</Label>
                <Input 
                  id="product-threshold" 
                  type="number"
                  placeholder="0" 
                  value={productForm.lowStockThreshold || ''}
                  onChange={(e) => setProductForm({ 
                    ...productForm, 
                    lowStockThreshold: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="product-active"
                checked={productForm.isActive || false}
                onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-pos-blue focus:ring-pos-blue"
              />
              <Label htmlFor="product-active">Aktif</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveProduct}>{editingId ? 'Perbarui' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nama Kategori *</Label>
              <Input 
                id="category-name" 
                placeholder="Masukkan nama kategori" 
                value={categoryForm.name || ''}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category-desc">Deskripsi</Label>
              <Input 
                id="category-desc" 
                placeholder="Masukkan deskripsi kategori" 
                value={categoryForm.description || ''}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveCategory}>{editingId ? 'Perbarui' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Apakah Anda yakin ingin menghapus {deleteItem?.type === 'product' ? 'produk' : 'kategori'} <span className="font-medium">{deleteItem?.name}</span>?
            </p>
            {deleteItem?.type === 'category' && (
              <p className="text-red-500 mt-2 text-sm">
                Peringatan: Kategori hanya dapat dihapus jika tidak ada produk yang menggunakannya.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Products;
