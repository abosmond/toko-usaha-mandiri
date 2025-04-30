
import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/sonner';
import { Settings as SettingsIcon, Store, CreditCard, FileText, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Settings } from '@/contexts/SettingsContext';
import AppLayout from '@/components/layouts/AppLayout';

const formSchema = z.object({
  store_name: z.string().min(1, 'Store name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  tax_percentage: z.number().min(0, 'Tax must be at least 0%').max(100, 'Tax cannot exceed 100%'),
  receipt_footer: z.string().optional(),
  currency: z.string(),
  logo_path: z.string().optional(),
});

const SettingsPage = () => {
  const { settings, updateSettings, resetSettings, isLoading } = useSettings();
  
  const form = useForm<Settings>({
    resolver: zodResolver(formSchema),
    defaultValues: settings,
  });

  const onSubmit = (data: Settings) => {
    updateSettings(data);
  };

  const handleReset = () => {
    // Ask for confirmation before resetting
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      resetSettings();
      form.reset(settings);
    }
  };

  // Update the form when settings change
  React.useEffect(() => {
    form.reset(settings);
  }, [settings, form]);

  // Generate receipt preview
  const formatCurrency = (amount: number) => {
    const currency = form.watch('currency') || 'IDR';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
            <p className="text-muted-foreground">
              Manage your store information and settings
            </p>
          </div>
          <SettingsIcon className="h-8 w-8 text-gray-400" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="store-info" className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="store-info" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Store Information</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="transaction" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Transaction Settings</span>
                  <span className="sm:hidden">Transaction</span>
                </TabsTrigger>
                <TabsTrigger value="receipt" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Receipt Settings</span>
                  <span className="sm:hidden">Receipt</span>
                </TabsTrigger>
              </TabsList>

              {/* Store Information Tab */}
              <TabsContent value="store-info" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Store Information</CardTitle>
                    <CardDescription>
                      Update your store's basic information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="store_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter store name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter store address" 
                              {...field} 
                              className="min-h-24"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter store email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="logo_path"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter logo URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transaction Settings Tab */}
              <TabsContent value="transaction" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Settings</CardTitle>
                    <CardDescription>
                      Configure how transactions are processed and displayed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tax_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Percentage (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter tax percentage" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="IDR">IDR - Indonesian Rupiah</option>
                              <option value="USD">USD - US Dollar</option>
                              <option value="EUR">EUR - Euro</option>
                              <option value="SGD">SGD - Singapore Dollar</option>
                              <option value="MYR">MYR - Malaysian Ringgit</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Receipt Settings Tab */}
              <TabsContent value="receipt" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Receipt Settings</CardTitle>
                      <CardDescription>
                        Customize how your receipts appear to customers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="receipt_footer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Receipt Footer Text</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter text to appear at the bottom of receipts" 
                                {...field} 
                                className="min-h-24"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Receipt Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Receipt Preview</CardTitle>
                      <CardDescription>
                        See how your receipt will look to customers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 border rounded font-mono text-sm whitespace-pre-wrap">
                        <div className="text-center font-bold mb-2">
                          {form.watch('store_name') || 'Store Name'}
                        </div>
                        <div className="text-center text-xs mb-4">
                          {form.watch('address') || 'Store Address'}<br />
                          {form.watch('phone') && `Tel: ${form.watch('phone')}`}
                          {form.watch('phone') && form.watch('email') && ' | '}
                          {form.watch('email') && `Email: ${form.watch('email')}`}
                        </div>
                        <div className="border-t border-b py-1 mb-2">
                          <div className="flex justify-between">
                            <span>Date:</span>
                            <span>{new Date().toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Receipt #:</span>
                            <span>INV-12345</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cashier:</span>
                            <span>Sample User</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between font-bold">
                            <span>Item</span>
                            <span>Total</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Product Sample (2x)</span>
                            <span>{formatCurrency(30000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Another Product (1x)</span>
                            <span>{formatCurrency(15000)}</span>
                          </div>
                        </div>
                        <div className="border-t pt-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(45000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax ({form.watch('tax_percentage')}%):</span>
                            <span>{formatCurrency(45000 * (form.watch('tax_percentage') / 100))}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Total:</span>
                            <span>{formatCurrency(45000 * (1 + form.watch('tax_percentage') / 100))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment (Cash):</span>
                            <span>{formatCurrency(50000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Change:</span>
                            <span>{formatCurrency(50000 - 45000 * (1 + form.watch('tax_percentage') / 100))}</span>
                          </div>
                        </div>
                        <div className="mt-4 text-center text-xs">
                          {form.watch('receipt_footer') || 'Thank you for your purchase!'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" /> 
                Reset to Default
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !form.formState.isDirty}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> 
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
