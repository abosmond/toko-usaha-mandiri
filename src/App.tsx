
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { TransactionProvider } from "@/contexts/TransactionContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import POS from "./pages/POS";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
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
            <ProductProvider>
              <TransactionProvider>
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
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TransactionProvider>
            </ProductProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
