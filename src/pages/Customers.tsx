import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';
import { Customer } from '@/types';
import { useCustomers } from '@/contexts/CustomerContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from 'sonner';

const Customers = () => {
  // States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Omit<Customer, 'createdAt' | 'updatedAt'> | null>(null);

  // Context
  const { customers, addCustomer, updateCustomer, deleteCustomer, searchCustomers } = useCustomers();

  // Filtered customers based on search
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  // Update filtered customers when dependencies change
  useEffect(() => {
    if (searchQuery) {
      setFilteredCustomers(searchCustomers(searchQuery));
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchQuery, searchCustomers]);

  // Handle add customer form submission
  const handleAddCustomer = () => {
    if (!newCustomer.name || newCustomer.name.trim() === '') {
      toast.error('Nama pelanggan harus diisi');
      return;
    }
    
    // Now name is guaranteed to be provided
    addCustomer({
      name: newCustomer.name,
      phone: newCustomer.phone || '',
      email: newCustomer.email || '',
      address: newCustomer.address || ''
    });
    
    // Reset form and close dialog
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
    setIsAddDialogOpen(false);
  };

  // Handle edit customer form submission
  const handleUpdateCustomer = () => {
    if (!editCustomer) return;

    if (!editCustomer.name || editCustomer.name.trim() === '') {
      toast.error('Nama pelanggan harus diisi');
      return;
    }

    updateCustomer(editCustomer.id, {
      name: editCustomer.name,
      phone: editCustomer.phone || '',
      email: editCustomer.email || '',
      address: editCustomer.address || ''
    });

    setEditCustomer(null);
    setIsEditDialogOpen(false);
  };

  // Handle delete customer
  const handleDeleteCustomer = (id: string) => {
    deleteCustomer(id);
  };

  // Format date to localized string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Pelanggan</h1>

          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
          </Button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Pelanggan</CardTitle>
              <CardDescription>Jumlah seluruh pelanggan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-3xl font-bold">{customers.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Cari nama pelanggan..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(customer.createdAt)}
                      </TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{customer.address || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setEditCustomer({
                              id: customer.id,
                              name: customer.name,
                              phone: customer.phone || '',
                              email: customer.email || '',
                              address: customer.address || ''
                            });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      Tidak ada data pelanggan yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                placeholder="Nama lengkap pelanggan"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                placeholder="Nomor telepon pelanggan"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Alamat email pelanggan"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                placeholder="Alamat lengkap pelanggan"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddCustomer}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Pelanggan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                placeholder="Nama lengkap pelanggan"
                value={editCustomer?.name || ''}
                onChange={(e) => setEditCustomer({ ...editCustomer!, name: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                placeholder="Nomor telepon pelanggan"
                value={editCustomer?.phone || ''}
                onChange={(e) => setEditCustomer({ ...editCustomer!, phone: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Alamat email pelanggan"
                value={editCustomer?.email || ''}
                onChange={(e) => setEditCustomer({ ...editCustomer!, email: e.target.value })}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                placeholder="Alamat lengkap pelanggan"
                value={editCustomer?.address || ''}
                onChange={(e) => setEditCustomer({ ...editCustomer!, address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
            <Button onClick={handleUpdateCustomer}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Customers;
