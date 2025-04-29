
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Supplier } from '@/types';
import { toast } from 'sonner';

// Mock suppliers data
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'PT Supplier Utama',
    contactName: 'Budi Santoso',
    phone: '08123456789',
    email: 'budi@supplierutama.com',
    address: 'Jl. Raya Utama No. 123, Jakarta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'CV Maju Bersama',
    contactName: 'Siti Rahayu',
    phone: '08765432100',
    email: 'siti@majubersama.com',
    address: 'Jl. Kemangi No. 45, Bandung',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'UD Sembako Jaya',
    contactName: 'Agus Priyanto',
    phone: '08567891234',
    email: 'agus@sembakoj.com',
    address: 'Jl. Pasar Lama No. 78, Surabaya',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'PT Elektronik Nusantara',
    contactName: 'Diana Putri',
    phone: '08912345678',
    email: 'diana@elektronus.com',
    address: 'Jl. Raya Elektronik No. 56, Medan',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'CV Furnitur Indonesia',
    contactName: 'Hendra Wijaya',
    phone: '08234567890',
    email: 'hendra@furnindo.com',
    address: 'Jl. Kayu Manis No. 23, Semarang',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface SupplierContextType {
  suppliers: Supplier[];
  getSupplierById: (id: string) => Supplier | undefined;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  searchSuppliers: (query: string) => Supplier[];
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);

  const getSupplierById = (id: string) => {
    return suppliers.find(supplier => supplier.id === id);
  };

  const addSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newSupplier = {
      ...supplier,
      id: (suppliers.length + 1).toString(),
      createdAt: now,
      updatedAt: now,
    };

    setSuppliers([...suppliers, newSupplier]);
    toast.success('Supplier berhasil ditambahkan');
  };

  const updateSupplier = (id: string, updatedSupplier: Partial<Supplier>) => {
    const updatedSuppliers = suppliers.map(supplier => {
      if (supplier.id === id) {
        return {
          ...supplier,
          ...updatedSupplier,
          updatedAt: new Date().toISOString(),
        };
      }
      return supplier;
    });

    setSuppliers(updatedSuppliers);
    toast.success('Supplier berhasil diperbarui');
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(supplier => supplier.id !== id));
    toast.success('Supplier berhasil dihapus');
  };

  const searchSuppliers = (query: string) => {
    if (!query) return suppliers;
    
    const lowercasedQuery = query.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(lowercasedQuery) ||
      (supplier.contactName && supplier.contactName.toLowerCase().includes(lowercasedQuery))
    );
  };

  return (
    <SupplierContext.Provider
      value={{
        suppliers,
        getSupplierById,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        searchSuppliers,
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
};

export const useSuppliers = () => {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSuppliers must be used within a SupplierProvider');
  }
  return context;
};
