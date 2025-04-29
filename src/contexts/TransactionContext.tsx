
import React, { createContext, useState, useContext, useEffect } from 'react';
import { CartItem, Transaction, PaymentMethod } from '@/types';
import { useProducts } from './ProductContext';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface TransactionContextType {
  cart: CartItem[];
  transactions: Transaction[];
  addToCart: (cartItem: CartItem) => void;
  updateCartItem: (index: number, updates: Partial<CartItem>) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  calculateSubtotal: () => number;
  calculateTotal: (discount?: number) => number;
  completeTransaction: (paymentDetails: {
    paymentMethod: PaymentMethod;
    discount?: number;
    amountPaid?: number;
    customerName?: string;
  }) => Transaction;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getDailyTransactions: (date: string) => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Sample past transactions
const createMockTransactions = (): Transaction[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(today.getDate() - 2);

  return [
    {
      id: '1',
      items: [
        {
          product: {
            id: '1',
            name: 'Mie Instan',
            sku: 'MI001',
            price: 3500,
            categoryId: '1',
            stock: 50,
            lowStockThreshold: 10,
            isActive: true,
            createdAt: today.toISOString(),
            updatedAt: today.toISOString(),
          },
          quantity: 2,
        },
        {
          product: {
            id: '2',
            name: 'Air Mineral 600ml',
            sku: 'AM001',
            price: 4000,
            categoryId: '2',
            stock: 24,
            lowStockThreshold: 12,
            isActive: true,
            createdAt: today.toISOString(),
            updatedAt: today.toISOString(),
          },
          quantity: 1,
        },
      ],
      subtotal: 11000,
      total: 11000,
      paymentMethod: 'cash',
      change: 9000,
      cashierId: '3',
      createdAt: today.toISOString(),
    },
    {
      id: '2',
      items: [
        {
          product: {
            id: '3',
            name: 'Keripik Kentang',
            sku: 'KK001',
            price: 10000,
            categoryId: '3',
            stock: 15,
            lowStockThreshold: 5,
            isActive: true,
            createdAt: yesterday.toISOString(),
            updatedAt: yesterday.toISOString(),
          },
          quantity: 1,
        },
      ],
      subtotal: 10000,
      discount: 1000,
      total: 9000,
      paymentMethod: 'card',
      cashierId: '3',
      createdAt: yesterday.toISOString(),
    },
    {
      id: '3',
      items: [
        {
          product: {
            id: '4',
            name: 'Pulpen',
            sku: 'PP001',
            price: 2500,
            categoryId: '4',
            stock: 30,
            lowStockThreshold: 10,
            isActive: true,
            createdAt: dayBefore.toISOString(),
            updatedAt: dayBefore.toISOString(),
          },
          quantity: 5,
        },
        {
          product: {
            id: '7',
            name: 'Buku Tulis',
            sku: 'BT001',
            price: 5500,
            categoryId: '4',
            stock: 25,
            lowStockThreshold: 10,
            isActive: true,
            createdAt: dayBefore.toISOString(),
            updatedAt: dayBefore.toISOString(),
          },
          quantity: 2,
        },
      ],
      subtotal: 23500,
      total: 23500,
      paymentMethod: 'cash',
      change: 1500,
      cashierId: '3',
      customerName: 'Pembeli Alat Tulis',
      createdAt: dayBefore.toISOString(),
    },
  ];
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const stored = localStorage.getItem('posTransactions');
    return stored ? JSON.parse(stored) : createMockTransactions();
  });
  
  const { updateStock } = useProducts();
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem('posTransactions', JSON.stringify(transactions));
  }, [transactions]);

  const addToCart = (cartItem: CartItem) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      (item) => item.product.id === cartItem.product.id
    );
    
    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      updateCartItem(existingItemIndex, {
        quantity: cart[existingItemIndex].quantity + cartItem.quantity,
      });
      toast.info(`Jumlah ${cartItem.product.name} diperbarui dalam keranjang`);
    } else {
      // Add new item if doesn't exist
      setCart([...cart, cartItem]);
      toast.success(`${cartItem.product.name} ditambahkan ke keranjang`);
    }
  };

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    setCart(
      cart.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const removeFromCart = (index: number) => {
    const removedItem = cart[index];
    setCart(cart.filter((_, i) => i !== index));
    
    if (removedItem) {
      toast.info(`${removedItem.product.name} dihapus dari keranjang`);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = item.product.price * item.quantity;
      const itemDiscount = item.discount || 0;
      return total + (itemPrice - itemDiscount);
    }, 0);
  };

  const calculateTotal = (discount = 0) => {
    return calculateSubtotal() - discount;
  };

  const completeTransaction = (paymentDetails: {
    paymentMethod: PaymentMethod;
    discount?: number;
    amountPaid?: number;
    customerName?: string;
  }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    const subtotal = calculateSubtotal();
    const total = calculateTotal(paymentDetails.discount);
    
    let change = 0;
    if (paymentDetails.paymentMethod === 'cash' && paymentDetails.amountPaid) {
      if (paymentDetails.amountPaid < total) {
        throw new Error('Insufficient payment amount');
      }
      change = paymentDetails.amountPaid - total;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      items: [...cart],
      subtotal,
      discount: paymentDetails.discount,
      total,
      paymentMethod: paymentDetails.paymentMethod,
      change: paymentDetails.paymentMethod === 'cash' ? change : undefined,
      cashierId: user.id,
      customerName: paymentDetails.customerName,
      createdAt: new Date().toISOString(),
    };

    // Update stock for each product
    cart.forEach((item) => {
      updateStock(item.product.id, -item.quantity);
    });

    // Add transaction to history
    setTransactions([...transactions, transaction]);
    
    // Clear the cart
    clearCart();

    toast.success('Transaksi berhasil diselesaikan');
    
    return transaction;
  };

  const getTransactionById = (id: string) => {
    return transactions.find((transaction) => transaction.id === id);
  };

  const getTransactionsByDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter((transaction) => {
      const date = new Date(transaction.createdAt);
      return date >= start && date <= end;
    });
  };

  const getDailyTransactions = (date: string) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= targetDate && transactionDate < nextDate;
    });
  };

  const value = {
    cart,
    transactions,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    calculateSubtotal,
    calculateTotal,
    completeTransaction,
    getTransactionById,
    getTransactionsByDateRange,
    getDailyTransactions,
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
