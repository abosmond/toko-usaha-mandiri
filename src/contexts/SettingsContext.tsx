
import React, { createContext, useContext, useState } from 'react';
import { toast } from '@/components/ui/sonner';

export interface Settings {
  id: string;
  store_name: string;
  address: string;
  phone: string;
  email: string;
  tax_percentage: number;
  receipt_footer: string;
  currency: string;
  logo_path: string;
  updated_at: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  id: '1',
  store_name: 'Toko Saya',
  address: 'Jl. Contoh No. 123',
  phone: '08123456789',
  email: 'toko@example.com',
  tax_percentage: 10.00,
  receipt_footer: 'Terima kasih telah berbelanja di toko kami!',
  currency: 'IDR',
  logo_path: '',
  updated_at: new Date().toISOString()
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      setIsLoading(true);
      // In a real app, we would make an API call here
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedSettings = {
        ...settings,
        ...newSettings,
        updated_at: new Date().toISOString()
      };
      setSettings(updatedSettings);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSettings({
        ...defaultSettings,
        updated_at: new Date().toISOString()
      });
      toast.success('Settings reset to default');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    settings,
    updateSettings,
    resetSettings,
    isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
