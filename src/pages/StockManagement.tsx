import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { useProducts } from '@/contexts/ProductContext';
import { useSuppliers } from '@/contexts/SupplierContext';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import { StockAdjustment, StockAdjustmentType, Product, Supplier } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Truck,
  Box,
  ArrowUp,
  ArrowDown,
  Plus
} from "lucide-react";
import { id } from 'date-fns/locale';

const StockManagement = () => {
  // States
  const [activeTab, setActiveTab] = useState<'all' | StockAdjustmentType>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<StockAdjustmentType>('purchase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  
  // Context
  const { 
    products, 
    stockAdjustments, 
    updateStock, 
    getStockAdjustmentsByType,
    getStockAdjustmentsByDateRange,
    getMonthlyPurchases,
    getMonthlyLossesReturns,
    getLowStockProducts
  } = useProducts();
  
  const { suppliers } = useSuppliers();
  const { user } = useAuth();
  
  // Filtered adjustments based on search, date range, and tab
  const [filteredAdjustments, setFilteredAdjustments] = useState<StockAdjustment[]>([]);
  
  // Selected product details
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Calculate new stock preview
  const newStockPreview = selectedProduct ? selectedProduct.stock + adjustmentQuantity : 0;
  
  // Update filtered adjustments when dependencies change
  useEffect(() => {
    let adjustments: StockAdjustment[] = [];
    
    // First filter by tab (adjustment type)
    if (activeTab === 'all') {
      adjustments = [...stockAdjustments];
    } else {
      adjustments = getStockAdjustmentsByType(activeTab);
    }
    
    // Then filter by date range
    adjustments = adjustments.filter(adj => {
      const adjDate = new Date(adj.createdAt);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return adjDate >= start && adjDate <= end;
    });
    
    // Then filter by search query (product name)
    if (searchQuery) {
      adjustments = adjustments.filter(adj => 
        adj.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by date (newest first)
    adjustments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredAdjustments(adjustments);
  }, [stockAdjustments, activeTab, startDate, endDate, searchQuery, getStockAdjustmentsByType]);
  
  // Handle product change
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId) || null;
    setSelectedProduct(product);
  };
  
  // Handle adjustment type change
  const handleTypeChange = (type: StockAdjustmentType) => {
    setSelectedType(type);
    
    // Reset supplier if not purchase
    if (type !== 'purchase') {
      setSelectedSupplierId('');
    }
    
    // Set a default direction for the quantity based on type
    if (type === 'purchase') {
      setAdjustmentQuantity(Math.abs(adjustmentQuantity));
    } else if (type === 'loss' || type === 'return') {
      setAdjustmentQuantity(-Math.abs(adjustmentQuantity));
    }
    // For correction, keep the sign as is
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!selectedProductId) {
      alert('Pilih produk terlebih dahulu');
      return;
    }
    
    if (adjustmentQuantity === 0) {
      alert('Jumlah penyesuaian tidak boleh 0');
      return;
    }
    
    // Validate based on type
    if (selectedType === 'purchase' && adjustmentQuantity <= 0) {
      alert('Jumlah pembelian harus positif');
      return;
    }
    
    if ((selectedType === 'loss' || selectedType === 'return') && adjustmentQuantity >= 0) {
      alert('Jumlah kehilangan atau retur harus negatif');
      return;
    }
    
    if (selectedType === 'purchase' && !selectedSupplierId) {
      alert('Pilih supplier untuk pembelian');
      return;
    }
    
    // Check if it would make stock negative
    if (selectedProduct && selectedProduct.stock + adjustmentQuantity < 0) {
      alert('Stok tidak boleh negatif');
      return;
    }
    
    // Update stock
    updateStock(
      selectedProductId,
      adjustmentQuantity,
      selectedType,
      selectedType === 'purchase' ? selectedSupplierId : undefined,
      notes
    );
    
    // Reset form
    resetForm();
    setIsDialogOpen(false);
  };
  
  // Reset form
  const resetForm = () => {
    setSelectedProductId('');
    setSelectedProduct(null);
    setSelectedType('purchase');
    setSelectedSupplierId('');
    setAdjustmentQuantity(0);
    setNotes('');
  };
  
  // Get icon for adjustment type
  const getAdjustmentIcon = (type: StockAdjustmentType) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'loss':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'correction':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'return':
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };
  
  // Format date to localized string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get adjustment quantity with sign
  const getAdjustmentWithSign = (adjustment: number) => {
    return adjustment > 0 ? `+${adjustment}` : adjustment;
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Manajemen Stok</h1>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Penyesuaian Stok
          </Button>
        </div>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Produk Stok Rendah</CardTitle>
              <CardDescription>Jumlah produk di bawah ambang batas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Box className="h-10 w-10 text-amber-500 mr-2" />
                <span className="text-3xl font-bold">{getLowStockProducts().length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pembelian Bulan Ini</CardTitle>
              <CardDescription>Total transaksi pembelian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Truck className="h-10 w-10 text-green-500 mr-2" />
                <span className="text-3xl font-bold">{getMonthlyPurchases()}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Kehilangan & Retur</CardTitle>
              <CardDescription>Total bulan ini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingDown className="h-10 w-10 text-red-500 mr-2" />
                <span className="text-3xl font-bold">{getMonthlyLossesReturns()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Cari nama produk..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="start-date" className="text-xs text-gray-500">Tanggal Mulai</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="end-date" className="text-xs text-gray-500">Tanggal Akhir</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={() => {
              setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
              setEndDate(format(new Date(), 'yyyy-MM-dd'));
              setSearchQuery('');
            }}>
              <Filter className="mr-2 h-4 w-4" /> Reset Filter
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | StockAdjustmentType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="purchase">Pembelian</TabsTrigger>
            <TabsTrigger value="loss">Kehilangan</TabsTrigger>
            <TabsTrigger value="correction">Koreksi</TabsTrigger>
            <TabsTrigger value="return">Retur</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Stok Sebelumnya</TableHead>
                      <TableHead>Penyesuaian</TableHead>
                      <TableHead>Stok Baru</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Pengguna</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdjustments.length > 0 ? (
                      filteredAdjustments.map((adjustment) => (
                        <TableRow key={adjustment.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatDate(adjustment.createdAt)}
                          </TableCell>
                          <TableCell>{adjustment.productName}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getAdjustmentIcon(adjustment.adjustmentType)}
                              <span className="ml-2 capitalize">
                                {adjustment.adjustmentType === 'purchase' ? 'Pembelian' :
                                 adjustment.adjustmentType === 'loss' ? 'Kehilangan' :
                                 adjustment.adjustmentType === 'correction' ? 'Koreksi' : 'Retur'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{adjustment.previousStock}</TableCell>
                          <TableCell>
                            <span className={`flex items-center ${
                              adjustment.adjustmentQuantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {adjustment.adjustmentQuantity > 0 ? (
                                <ArrowUp className="mr-1 h-4 w-4" />
                              ) : (
                                <ArrowDown className="mr-1 h-4 w-4" />
                              )}
                              {getAdjustmentWithSign(adjustment.adjustmentQuantity)}
                            </span>
                          </TableCell>
                          <TableCell>{adjustment.newStock}</TableCell>
                          <TableCell>{adjustment.supplierName || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {adjustment.notes || '-'}
                          </TableCell>
                          <TableCell>{adjustment.userName}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6 text-gray-500">
                          <Package className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                          <p>Tidak ada data penyesuaian stok yang ditemukan.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Stock Adjustment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Penyesuaian Stok</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">Produk *</Label>
              <Select value={selectedProductId} onValueChange={handleProductChange}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.stock} tersedia)
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipe Penyesuaian *</Label>
              <Select 
                value={selectedType} 
                onValueChange={(value) => handleTypeChange(value as StockAdjustmentType)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Pilih tipe penyesuaian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Pembelian</SelectItem>
                  <SelectItem value="loss">Kehilangan</SelectItem>
                  <SelectItem value="correction">Koreksi</SelectItem>
                  <SelectItem value="return">Retur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Supplier (only for purchase) */}
            {selectedType === 'purchase' && (
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Pilih supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah Penyesuaian *</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="quantity"
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                />
                
                {selectedProduct && (
                  <div className="text-sm">
                    <span className="font-medium">Stok Saat Ini:</span> {selectedProduct.stock}
                  </div>
                )}
              </div>
              
              {selectedProduct && (
                <div className="flex items-center mt-2 p-2 bg-gray-50 rounded">
                  <span className="font-medium mr-2">Stok Setelah Penyesuaian:</span>
                  <span className={`${newStockPreview < 0 ? 'text-red-500' : ''}`}>
                    {newStockPreview}
                  </span>
                </div>
              )}
              
              {selectedType === 'purchase' && (
                <p className="text-xs text-gray-500">Harus bernilai positif (+) untuk pembelian</p>
              )}
              
              {(selectedType === 'loss' || selectedType === 'return') && (
                <p className="text-xs text-gray-500">Harus bernilai negatif (-) untuk kehilangan/retur</p>
              )}
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan atau keterangan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </AppLayout>
  );
};

export default StockManagement;
