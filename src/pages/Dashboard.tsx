
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from '@/contexts/ProductContext';
import { useTransactions } from '@/contexts/TransactionContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const Dashboard = () => {
  const { products, getLowStockProducts } = useProducts();
  const { transactions } = useTransactions();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const lowStockProducts = getLowStockProducts();

  useEffect(() => {
    // Generate daily sales data for the last 7 days
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const dailySales = last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayTransactions = transactions.filter(t => 
        t.createdAt.startsWith(dateStr)
      );
      
      return {
        date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        sales: dayTransactions.reduce((sum, t) => sum + t.total, 0),
        transactions: dayTransactions.length
      };
    });

    setSalesData(dailySales);

    // Generate category data
    const categorySales = products.reduce((result: any[], product) => {
      // Get all transactions that include this product
      const productTransactions = transactions.filter(t => 
        t.items.some(item => item.product.id === product.id)
      );
      
      const category = result.find(c => c.id === product.categoryId);
      const totalSold = productTransactions.reduce((sum, t) => {
        const item = t.items.find(i => i.product.id === product.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      
      if (category) {
        category.value += totalSold;
      } else {
        result.push({
          id: product.categoryId,
          name: product.categoryId, // Ideally we'd use category name here
          value: totalSold
        });
      }
      
      return result;
    }, []);

    setCategoryData(categorySales);
  }, [products, transactions]);

  // Calculate total sales, products, and transactions
  const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalProducts = products.length;
  const totalTransactions = transactions.length;

  // COLORS for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground mt-1">Dari {totalTransactions} transaksi</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Produk Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">{lowStockProducts.length} produk stok rendah</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Rata-rata Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalTransactions > 0
                  ? `Rp ${Math.floor(totalSales / totalTransactions).toLocaleString('id-ID')}`
                  : "Rp 0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per transaksi</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
              <CardDescription>Total penjualan harian</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis 
                    tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    width={100}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Penjualan']}
                  />
                  <Bar dataKey="sales" fill="#4299E1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Penjualan per Kategori</CardTitle>
              <CardDescription>Distribusi penjualan berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => entry.name}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip formatter={(value) => [`${value} unit`, 'Terjual']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle>Peringatan Stok Rendah</CardTitle>
            <CardDescription>Produk dengan stok di bawah ambang batas</CardDescription>
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
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="font-medium">{product.name}</td>
                        <td>{product.sku}</td>
                        <td className="text-red-500">{product.stock}</td>
                        <td>{product.lowStockThreshold}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted-foreground">
                        Tidak ada produk dengan stok rendah
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
