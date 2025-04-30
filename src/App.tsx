
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import { SupplierProvider } from "@/contexts/SupplierContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import POS from "./pages/POS";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import StockManagement from "./pages/StockManagement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SettingsProvider>
              <ProductProvider>
                <TransactionProvider>
                  <SupplierProvider>
                    <CustomerProvider>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        
                        <Route path="/dashboard" element={
                          <ProtectedRoute allowedRoles={['admin', 'manager']}>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/pos" element={
                          <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                            <POS />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/products" element={
                          <ProtectedRoute allowedRoles={['admin', 'manager']}>
                            <Products />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/stock" element={
                          <ProtectedRoute allowedRoles={['admin', 'manager']}>
                            <StockManagement />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/suppliers" element={
                          <ProtectedRoute allowedRoles={['admin', 'manager']}>
                            <Suppliers />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/customers" element={
                          <ProtectedRoute allowedRoles={['admin', 'manager']}>
                            <Customers />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/reports" element={
                          <ProtectedRoute allowedRoles={['admin', 'manager']}>
                            <Reports />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/users" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Users />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/settings" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <Settings />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </CustomerProvider>
                  </SupplierProvider>
                </TransactionProvider>
              </ProductProvider>
            </SettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
