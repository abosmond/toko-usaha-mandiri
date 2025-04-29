
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Customer, Transaction } from '@/types';
import { toast } from 'sonner';

// Mock customers data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Budi Santoso',
    phone: '08123456789',
    email: 'budi.santoso@email.com',
    address: 'Jl. Merdeka No. 123, Jakarta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Siti Rahayu',
    phone: '08765432100',
    email: 'siti.rahayu@email.com',
    address: 'Jl. Pahlawan No. 45, Bandung',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Ahmad Wijaya',
    phone: '08567891234',
    email: 'ahmad.wijaya@email.com',
    address: 'Jl. Sudirman No. 78, Surabaya',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Diana Putri',
    phone: '08912345678',
    email: 'diana.putri@email.com',
    address: 'Jl. Gatot Subroto No. 56, Medan',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Hendra Gunawan',
    phone: '08234567890',
    email: 'hendra.gunawan@email.com',
    address: 'Jl. Ahmad Yani No. 23, Semarang',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock transactions data (for optional feature)
const mockCustomerTransactions: { [customerId: string]: Transaction[] } = {
  '1': [
    {
      id: 't1',
      items: [
        {
          product: {
            id: 'p1',
            name: 'Produk A',
            sku: 'SKU001',
            price: 15000,
            categoryId: 'c1',
            stock: 50,
            lowStockThreshold: 10,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          quantity: 2,
        }
      ],
      subtotal: 30000,
      total: 30000,
      paymentMethod: 'cash',
      cashierId: 'u1',
      customerId: '1',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    }
  ],
  '2': [
    {
      id: 't2',
      items: [
        {
          product: {
            id: 'p2',
            name: 'Produk B',
            sku: 'SKU002',
            price: 25000,
            categoryId: 'c2',
            stock: 30,
            lowStockThreshold: 5,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          quantity: 1,
        }
      ],
      subtotal: 25000,
      total: 25000,
      paymentMethod: 'card',
      cashierId: 'u1',
      customerId: '2',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    }
  ]
};

interface CustomerContextType {
  customers: Customer[];
  getCustomerById: (id: string) => Customer | undefined;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  searchCustomers: (query: string) => Customer[];
  getCustomerTransactions: (customerId: string) => Transaction[];
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newCustomer = {
      ...customer,
      id: (customers.length + 1).toString(),
      createdAt: now,
      updatedAt: now,
    };

    setCustomers([...customers, newCustomer]);
    toast.success('Pelanggan berhasil ditambahkan');
  };

  const updateCustomer = (id: string, updatedCustomer: Partial<Customer>) => {
    const updatedCustomers = customers.map(customer => {
      if (customer.id === id) {
        return {
          ...customer,
          ...updatedCustomer,
          updatedAt: new Date().toISOString(),
        };
      }
      return customer;
    });

    setCustomers(updatedCustomers);
    toast.success('Data pelanggan berhasil diperbarui');
  };

  const deleteCustomer = (id: string) => {
    setCustomers(customers.filter(customer => customer.id !== id));
    toast.success('Pelanggan berhasil dihapus');
  };

  const searchCustomers = (query: string) => {
    if (!query) return customers;
    
    const lowercasedQuery = query.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(lowercasedQuery) ||
      (customer.phone && customer.phone.includes(query)) ||
      (customer.email && customer.email.toLowerCase().includes(lowercasedQuery))
    );
  };

  const getCustomerTransactions = (customerId: string) => {
    return mockCustomerTransactions[customerId] || [];
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        getCustomerById,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        searchCustomers,
        getCustomerTransactions,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};
