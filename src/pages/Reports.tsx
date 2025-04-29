
import { useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { useTransactions } from '@/contexts/TransactionContext';
import { useProducts } from '@/contexts/ProductContext';
import { Transaction } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileText,
  Download,
  ChartBar,
  Box
} from "lucide-react";

interface DateRange {
  startDate: string;
  endDate: string;
}

const Reports = () => {
  const { transactions } = useTransactions();
  const { products, getLowStockProducts } = useProducts();
  
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'profit'>('sales');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 1);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  });
  
  const filterTransactionsByDateRange = (transactions: Transaction[], { startDate, endDate }: DateRange) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return transactions.filter(transaction => {
      const date = new Date(transaction.createdAt);
      return date >= start && date <= end;
    });
  };
  
  const filteredTransactions = filterTransactionsByDateRange(transactions, dateRange);
  
  // Group transactions by date
  const transactionsByDate = filteredTransactions.reduce<Record<string, Transaction[]>>((acc, transaction) => {
    const date = transaction.createdAt.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(transaction);
    return acc;
  }, {});
  
  // Generate sales data by date
  const salesData = Object.entries(transactionsByDate).map(([date, dayTransactions]) => {
    return {
      date,
      formattedDate: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      sales: dayTransactions.reduce((sum, t) => sum + t.total, 0),
      transactions: dayTransactions.length,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
  
  // Generate payment method data
  const paymentMethodData = filteredTransactions.reduce<Record<string, { count: number, value: number }>>((acc, transaction) => {
    const method = transaction.paymentMethod;
    if (!acc[method]) acc[method] = { count: 0, value: 0 };
    acc[method].count += 1;
    acc[method].value += transaction.total;
    return acc;
  }, {});
  
  const paymentMethodChartData = Object.entries(paymentMethodData).map(([method, data]) => {
    const displayName = method === 'cash' ? 'Tunai' : method === 'card' ? 'Kartu' : 'E-Wallet';
    return {
      name: displayName,
      value: data.count,
      sales: data.value,
    };
  });
  
  // Generate product sales data
  const productSalesData = filteredTransactions.reduce<Record<string, { quantity: number, sales: number }>>((acc, transaction) => {
    transaction.items.forEach(item => {
      const productId = item.product.id;
      if (!acc[productId]) acc[productId] = { quantity: 0, sales: 0 };
      acc[productId].quantity += item.quantity;
      acc[productId].sales += item.product.price * item.quantity;
    });
    return acc;
  }, {});
  
  const topProductsData = Object.entries(productSalesData)
    .map(([productId, data]) => {
      const product = products.find(p => p.id === productId);
      return {
        id: productId,
        name: product?.name || 'Unknown Product',
        quantity: data.quantity,
        sales: data.sales,
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);
  
  // Inventory data
  const lowStockProducts = getLowStockProducts();
  const outOfStockProducts = products.filter(product => product.isActive && product.stock === 0);
  
  // Calculate profit/loss
  const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const costOfGoods = filteredTransactions.reduce((sum, t) => {
    return sum + t.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.product.id);
      const cost = product?.cost || 0;
      return itemSum + (cost * item.quantity);
    }, 0);
  }, 0);
  const grossProfit = totalSales - costOfGoods;
  const grossProfitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
  
  // COLORS for charts
  const COLORS = ['#4299E1', '#48BB78', '#F56565', '#ED8936', '#9F7AEA'];
  
  // Export data to CSV
  const exportToCSV = (filename: string, rows: Array<Record<string, any>>) => {
    if (rows.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        const cell = row[header];
        const cellStr = cell === null || cell === undefined ? '' : String(cell);
        return `"${cellStr.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getSalesReportCSV = () => {
    const data = salesData.map(item => ({
      'Tanggal': new Date(item.date).toLocaleDateString('id-ID'),
      'Penjualan (Rp)': item.sales,
      'Jumlah Transaksi': item.transactions,
    }));
    exportToCSV(`laporan-penjualan-${dateRange.startDate}-${dateRange.endDate}`, data);
  };
  
  const getInventoryReportCSV = () => {
    const data = products.map(product => ({
      'Nama': product.name,
      'SKU': product.sku,
      'Harga': product.price,
      'Stok': product.stock,
      'Stok Minimum': product.lowStockThreshold,
      'Status': product.isActive ? 'Aktif' : 'Nonaktif',
    }));
    exportToCSV(`laporan-inventori-${new Date().toISOString().split('T')[0]}`, data);
  };
  
  const getProfitReportCSV = () => {
    const transactionsData = filteredTransactions.map(transaction => {
      const cost = transaction.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.product.id);
        return sum + ((product?.cost || 0) * item.quantity);
      }, 0);
      const profit = transaction.total - cost;
      
      return {
        'Tanggal': new Date(transaction.createdAt).toLocaleDateString('id-ID'),
        'ID Transaksi': transaction.id,
        'Total (Rp)': transaction.total,
        'Modal (Rp)': cost,
        'Laba (Rp)': profit,
        'Margin (%)': transaction.total > 0 ? ((profit / transaction.total) * 100).toFixed(2) : '0',
      };
    });
    exportToCSV(`laporan-laba-rugi-${dateRange.startDate}-${dateRange.endDate}`, transactionsData);
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Laporan</h1>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="start-date" className="whitespace-nowrap">Dari:</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end-date" className="whitespace-nowrap">Hingga:</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-40"
              />
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="sales" value={activeTab} onValueChange={(value) => setActiveTab(value as 'sales' | 'inventory' | 'profit')}>
          <TabsList className="mb-4">
            <TabsTrigger value="sales">Penjualan</TabsTrigger>
            <TabsTrigger value="inventory">Inventori</TabsTrigger>
            <TabsTrigger value="profit">Laba/Rugi</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold">Laporan Penjualan</h2>
                
                <Button variant="outline" onClick={getSalesReportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Penjualan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Jumlah Transaksi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Rata-Rata per Transaksi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {filteredTransactions.length > 0 
                        ? `Rp ${Math.floor(totalSales / filteredTransactions.length).toLocaleString('id-ID')}` 
                        : 'Rp 0'}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Penjualan Harian</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="formattedDate" />
                        <YAxis tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} width={100} />
                        <Tooltip formatter={(value: any) => [`Rp ${parseInt(value).toLocaleString('id-ID')}`, 'Penjualan']} />
                        <Bar dataKey="sales" fill="#4299E1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Metode Pembayaran</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <div className="h-full flex flex-col justify-center">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            dataKey="value"
                            nameKey="name"
                            isAnimationActive={true}
                            data={paymentMethodChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {paymentMethodChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [value, 'Transaksi']} />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Legend */}
                      <div className="flex justify-center gap-4 mt-4">
                        {paymentMethodChartData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center">
                            <div
                              className="w-3 h-3 mr-1"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm">{entry.name}: {entry.value} ({`Rp ${entry.sales.toLocaleString('id-ID')}`})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Produk Terlaris</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="table-container">
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>Nama Produk</th>
                          <th>Jumlah Terjual</th>
                          <th>Total Penjualan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProductsData.length > 0 ? (
                          topProductsData.map((product) => (
                            <tr key={product.id}>
                              <td>{product.name}</td>
                              <td>{product.quantity}</td>
                              <td>Rp {product.sales.toLocaleString('id-ID')}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center py-4 text-muted-foreground">
                              Tidak ada data penjualan produk
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="inventory">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold">Laporan Inventori</h2>
                
                <Button variant="outline" onClick={getInventoryReportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Produk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{products.filter(p => p.isActive).length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Stok Rendah</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-500">{lowStockProducts.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Stok Habis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{outOfStockProducts.length}</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Produk Stok Rendah</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="table-container">
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>Nama Produk</th>
                          <th>SKU</th>
                          <th>Stok Sekarang</th>
                          <th>Ambang Batas</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockProducts.length > 0 ? (
                          lowStockProducts.map((product) => (
                            <tr key={product.id}>
                              <td className="font-medium">{product.name}</td>
                              <td>{product.sku}</td>
                              <td className={product.stock === 0 ? 'text-red-500' : 'text-amber-500'}>
                                {product.stock}
                              </td>
                              <td>{product.lowStockThreshold}</td>
                              <td>
                                {product.stock === 0 ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Stok Habis
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    Stok Rendah
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-muted-foreground">
                              Semua produk memiliki stok yang cukup
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="profit">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold">Laporan Laba/Rugi</h2>
                
                <Button variant="outline" onClick={getProfitReportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Penjualan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Harga Pokok</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Rp {costOfGoods.toLocaleString('id-ID')}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Laba Kotor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">Rp {grossProfit.toLocaleString('id-ID')}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Margin Laba</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{grossProfitMargin.toFixed(2)}%</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Detail Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="table-container">
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th>ID Transaksi</th>
                          <th>Total Penjualan</th>
                          <th>Harga Pokok</th>
                          <th>Laba</th>
                          <th>Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((transaction) => {
                            const cost = transaction.items.reduce((sum, item) => {
                              const product = products.find(p => p.id === item.product.id);
                              return sum + ((product?.cost || 0) * item.quantity);
                            }, 0);
                            const profit = transaction.total - cost;
                            const margin = transaction.total > 0 ? (profit / transaction.total) * 100 : 0;
                            
                            const date = new Date(transaction.createdAt);
                            
                            return (
                              <tr key={transaction.id}>
                                <td>{date.toLocaleDateString('id-ID')}</td>
                                <td>{transaction.id}</td>
                                <td>Rp {transaction.total.toLocaleString('id-ID')}</td>
                                <td>Rp {cost.toLocaleString('id-ID')}</td>
                                <td className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  Rp {profit.toLocaleString('id-ID')}
                                </td>
                                <td>{margin.toFixed(2)}%</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-muted-foreground">
                              Tidak ada data transaksi pada periode yang dipilih
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Reports;
