
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { UserRole } from '@/types';
import { 
  LogOut,
  User,
  Search,
  CreditCard,
  Box,
  FileText,
  BarChart,
  Users,
  Truck,
  UserPlus,
  Package
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  if (!user) {
    return <div>Loading...</div>;
  }

  const menuItems = [
    {
      name: "POS",
      path: "/pos",
      icon: <CreditCard className="w-6 h-6" />,
      allowedRoles: ['admin', 'manager', 'cashier'] as UserRole[],
    },
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <BarChart className="w-6 h-6" />,
      allowedRoles: ['admin', 'manager'] as UserRole[],
    },
    {
      name: "Produk",
      path: "/products",
      icon: <Box className="w-6 h-6" />,
      allowedRoles: ['admin', 'manager'] as UserRole[],
    },
    {
      name: "Stok",
      path: "/stock",
      icon: <Package className="w-6 h-6" />,
      allowedRoles: ['admin', 'manager'] as UserRole[],
    },
    {
      name: "Supplier",
      path: "/suppliers",
      icon: <Truck className="w-6 h-6" />,
      allowedRoles: ['admin', 'manager'] as UserRole[],
    },
    {
      name: "Pelanggan",
      path: "/customers",
      icon: <UserPlus className="w-6 h-6" />,
      allowedRoles: ['admin', 'manager'] as UserRole[],
    },
    {
      name: "Laporan",
      path: "/reports",
      icon: <FileText className="w-6 h-6" />,
      allowedRoles: ['admin', 'manager'] as UserRole[],
    },
    {
      name: "Pengguna",
      path: "/users",
      icon: <Users className="w-6 h-6" />,
      allowedRoles: ['admin'] as UserRole[],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar - for tablet and larger */}
      <div className="hidden md:flex w-20 lg:w-64 bg-pos-blue-dark flex-col min-h-screen">
        <div className="p-4 text-white flex justify-center lg:justify-start items-center">
          <span className="text-xl font-bold hidden lg:block">Toko Usaha Mandiri</span>
          <span className="text-xl font-bold lg:hidden">TUM</span>
        </div>
        <div className="mt-8 flex flex-col flex-1">
          {menuItems.map((item) => (
            hasPermission(item.allowedRoles) && (
              <TooltipProvider key={item.path} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`
                        flex items-center p-4 w-full 
                        ${location.pathname === item.path 
                          ? 'bg-pos-blue text-white' 
                          : 'text-gray-300 hover:bg-sidebar-accent hover:text-white'
                        }
                        transition-colors
                      `}
                    >
                      <div className="flex justify-center lg:justify-start items-center w-full">
                        {item.icon}
                        <span className="ml-4 hidden lg:block">{item.name}</span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="lg:hidden">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          ))}
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-center lg:justify-start space-x-2 text-white mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="hidden lg:block">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-gray-300 capitalize">{user.role}</div>
            </div>
          </div>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full text-white border-white hover:bg-white hover:text-pos-blue-dark"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                Logout
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-pos-blue-dark text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Toko Usaha Mandiri</h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" className="p-2 text-white hover:bg-sidebar-accent">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" className="p-2 text-white hover:bg-sidebar-accent" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-pos-blue-dark flex justify-around items-center p-3 z-10">
        {menuItems.map((item) => (
          hasPermission(item.allowedRoles) && (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-md
                ${location.pathname === item.path 
                  ? 'text-white bg-pos-blue' 
                  : 'text-gray-300 hover:text-white'
                }
              `}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          )
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 pb-16 md:pb-0 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
