
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { useProducts } from '@/contexts/ProductContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Product, CartItem, PaymentMethod } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search,
  Minus,
  Plus,
  ShoppingBag, 
  Trash2,
  Barcode,
  Printer,
  Cash,
  CreditCard,
  Wallet
} from "lucide-react";
import { toast } from 'sonner';

const POS = () => {
  const { products, categories, searchProducts, getProductsByCategory } = useProducts();
  const { cart, addToCart, updateCartItem, removeFromCart, clearCart, calculateSubtotal, calculateTotal, completeTransaction } = useTransactions();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (searchQuery) {
      setFilteredProducts(searchProducts(searchQuery));
    } else if (activeCategory === 'all') {
      setFilteredProducts(products.filter(p => p.isActive));
    } else {
      setFilteredProducts(getProductsByCategory(activeCategory));
    }
  }, [searchQuery, activeCategory, products, searchProducts, getProductsByCategory]);

  useEffect(() => {
    // Focus search input on mount
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`Stok ${product.name} habis!`);
      return;
    }
    
    addToCart({
      product,
      quantity: 1
    });
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const item = cart[index];
    if (!item) return;
    
    const newQuantity = item.quantity + quantity;
    
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    if (newQuantity > item.product.stock) {
      toast.error(`Stok ${item.product.name} tidak mencukupi!`);
      return;
    }
    
    updateCartItem(index, { quantity: newQuantity });
  };

  const handleCompletePayment = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong!');
      return;
    }

    try {
      const amountPaidValue = amountPaid ? parseFloat(amountPaid) : 0;
      const discountValue = discount ? parseFloat(discount) : 0;
      const totalValue = calculateTotal(discountValue);
      
      if (paymentMethod === 'cash' && amountPaidValue < totalValue) {
        toast.error('Jumlah pembayaran kurang dari total!');
        return;
      }
      
      const transaction = completeTransaction({
        paymentMethod,
        amountPaid: amountPaidValue,
        discount: discountValue,
        customerName: customerName || undefined,
      });
      
      setCurrentReceipt({
        ...transaction,
        cashierName: user?.name,
      });
      
      setIsPaymentModalOpen(false);
      setReceiptDialogOpen(true);
      
      // Reset payment form
      setPaymentMethod('cash');
      setAmountPaid('');
      setDiscount('');
      setCustomerName('');
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    }
  };

  const handlePrintReceipt = () => {
    toast.success('Struk berhasil dicetak!');
    setReceiptDialogOpen(false);
  };

  const subtotal = calculateSubtotal();
  const discountValue = discount ? parseFloat(discount) : 0;
  const total = calculateTotal(discountValue);
  const change = paymentMethod === 'cash' && amountPaid ? parseFloat(amountPaid) - total : 0;
  
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Point of Sale</h1>
        
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Product Selection */}
          <div className="w-full lg:w-2/3 bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
            {/* Search and Filter */}
            <div className="p-4 border-b">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Cari produk, barcode, atau SKU..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (searchInputRef.current) searchInputRef.current.focus();
                  }}
                >
                  <Barcode size={18} />
                </Button>
              </div>
              
              <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
                  <TabsTrigger value="all">Semua</TabsTrigger>
                  {categories.map(category => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            
            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      className={`
                        bg-white rounded-lg shadow-sm p-3 text-left transition-all hover:shadow 
                        ${product.stock <= 0 ? 'opacity-60' : 'hover:scale-105'}
                      `}
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-gray-500 text-sm truncate">SKU: {product.sku}</div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="font-bold text-pos-blue-dark">Rp {product.price.toLocaleString('id-ID')}</div>
                        <div className={`text-sm ${product.stock <= product.lowStockThreshold ? 'text-red-500' : 'text-gray-500'}`}>
                          Stok: {product.stock}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingBag size={48} className="mb-2 opacity-30" />
                  {searchQuery ? (
                    <p>Tidak ada produk yang cocok dengan pencarian.</p>
                  ) : (
                    <p>Tidak ada produk dalam kategori ini.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Shopping Cart */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg shadow flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">Keranjang Belanja</h2>
              {cart.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} className="mr-1" /> Kosongkan
                </Button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-3">
                      <div className="flex-1">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-gray-500">Rp {item.product.price.toLocaleString('id-ID')} x {item.quantity}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleUpdateQuantity(index, -1)}
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleUpdateQuantity(index, 1)}
                        >
                          <Plus size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700" 
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingBag size={48} className="mb-2 opacity-30" />
                  <p>Keranjang kosong.</p>
                  <p className="text-sm">Tambahkan produk untuk memulai.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Item:</span>
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} item</span>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                disabled={cart.length === 0}
                onClick={() => setIsPaymentModalOpen(true)}
              >
                Bayar - Rp {subtotal.toLocaleString('id-ID')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="customerName">Nama Pelanggan (Opsional)</Label>
              <Input 
                id="customerName" 
                placeholder="Masukkan nama pelanggan" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input 
                  id="subtotal" 
                  value={`Rp ${subtotal.toLocaleString('id-ID')}`}
                  readOnly
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="discount">Diskon (Rp)</Label>
                <Input 
                  id="discount" 
                  type="number"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="total">Total</Label>
              <Input 
                id="total" 
                className="text-lg font-bold"
                value={`Rp ${total.toLocaleString('id-ID')}`}
                readOnly
                disabled
              />
            </div>
            
            <div>
              <Label>Metode Pembayaran</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Button 
                  type="button" 
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'} 
                  className={`flex flex-col items-center justify-center h-24 ${
                    paymentMethod === 'cash' ? 'bg-pos-blue text-white' : ''
                  }`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Cash className="h-8 w-8 mb-2" />
                  <span>Tunai</span>
                </Button>
                <Button 
                  type="button" 
                  variant={paymentMethod === 'card' ? 'default' : 'outline'} 
                  className={`flex flex-col items-center justify-center h-24 ${
                    paymentMethod === 'card' ? 'bg-pos-blue text-white' : ''
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-8 w-8 mb-2" />
                  <span>Kartu</span>
                </Button>
                <Button 
                  type="button" 
                  variant={paymentMethod === 'e-wallet' ? 'default' : 'outline'} 
                  className={`flex flex-col items-center justify-center h-24 ${
                    paymentMethod === 'e-wallet' ? 'bg-pos-blue text-white' : ''
                  }`}
                  onClick={() => setPaymentMethod('e-wallet')}
                >
                  <Wallet className="h-8 w-8 mb-2" />
                  <span>E-Wallet</span>
                </Button>
              </div>
            </div>
            
            {paymentMethod === 'cash' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amountPaid">Jumlah Pembayaran</Label>
                  <Input 
                    id="amountPaid" 
                    type="number"
                    placeholder="Masukkan jumlah pembayaran"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                </div>
                
                {amountPaid && parseFloat(amountPaid) >= total && (
                  <div>
                    <Label htmlFor="change">Kembalian</Label>
                    <Input 
                      id="change" 
                      className="text-lg font-bold"
                      value={`Rp ${change.toLocaleString('id-ID')}`}
                      readOnly
                      disabled
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Batal</Button>
            <Button onClick={handleCompletePayment}>
              Selesaikan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Struk Pembayaran</DialogTitle>
          </DialogHeader>
          
          {currentReceipt && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <h3 className="font-bold text-lg">Toko Usaha Mandiri</h3>
                <p className="text-sm text-gray-500">Jl. Raya Mandiri No. 123</p>
                <p className="text-sm text-gray-500">Telp. 021-12345678</p>
              </div>
              
              <div className="border-t border-b py-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>No. Transaksi:</div>
                  <div className="text-right">{currentReceipt.id}</div>
                  <div>Tanggal:</div>
                  <div className="text-right">
                    {new Date(currentReceipt.createdAt).toLocaleDateString('id-ID')}
                  </div>
                  <div>Waktu:</div>
                  <div className="text-right">
                    {new Date(currentReceipt.createdAt).toLocaleTimeString('id-ID')}
                  </div>
                  <div>Kasir:</div>
                  <div className="text-right">{currentReceipt.cashierName}</div>
                  {currentReceipt.customerName && (
                    <>
                      <div>Pelanggan:</div>
                      <div className="text-right">{currentReceipt.customerName}</div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-bold flex justify-between pb-1 border-b">
                  <span>Item</span>
                  <span>Subtotal</span>
                </div>
                
                {currentReceipt.items.map((item: CartItem, index: number) => (
                  <div key={index} className="text-sm flex justify-between">
                    <div>
                      <div>{item.product.name}</div>
                      <div className="text-gray-500">{item.quantity} x Rp {item.product.price.toLocaleString('id-ID')}</div>
                    </div>
                    <div>Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {currentReceipt.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {currentReceipt.discount && (
                  <div className="flex justify-between">
                    <span>Diskon:</span>
                    <span>Rp {currentReceipt.discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-1">
                  <span>Total:</span>
                  <span>Rp {currentReceipt.total.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Metode Pembayaran:</span>
                  <span>
                    {currentReceipt.paymentMethod === 'cash' ? 'Tunai' : 
                     currentReceipt.paymentMethod === 'card' ? 'Kartu' : 'E-Wallet'}
                  </span>
                </div>
                {currentReceipt.change !== undefined && (
                  <>
                    <div className="flex justify-between">
                      <span>Dibayar:</span>
                      <span>Rp {(currentReceipt.total + currentReceipt.change).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kembalian:</span>
                      <span>Rp {currentReceipt.change.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                <p>Terima kasih telah berbelanja</p>
                <p>Selamat datang kembali</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setReceiptDialogOpen(false)}
            >
              Tutup
            </Button>
            <Button 
              className="w-full"
              onClick={handlePrintReceipt}
            >
              <Printer className="mr-2 h-4 w-4" /> Cetak Struk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default POS;
