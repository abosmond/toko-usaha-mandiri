
import { useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { User, UserRole } from '@/types';
import { 
  Search,
  Plus,
  Trash2,
  Edit,
  Users as UsersIcon
} from "lucide-react";
import { toast } from 'sonner';

const Users = () => {
  // Mockup users data - in a real app, this would come from a context or API
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    },
    {
      id: '2',
      name: 'Manager User',
      email: 'manager@example.com',
      role: 'manager',
    },
    {
      id: '3',
      name: 'Kasir User',
      email: 'cashier@example.com',
      role: 'cashier',
    },
    {
      id: '4',
      name: 'Supervisor Toko',
      email: 'supervisor@example.com',
      role: 'manager',
    },
    {
      id: '5',
      name: 'Kasir Part Time',
      email: 'kasir2@example.com',
      role: 'cashier',
    },
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'cashier' as UserRole,
    password: '',
    confirmPassword: '',
  });
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleOpenUserDialog = (user?: User) => {
    if (user) {
      setUserForm({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        confirmPassword: '',
      });
      setSelectedUserId(user.id);
    } else {
      setUserForm({
        name: '',
        email: '',
        role: 'cashier',
        password: '',
        confirmPassword: '',
      });
      setSelectedUserId(null);
    }
    setIsUserDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (userId: string) => {
    setSelectedUserId(userId);
    setIsDeleteDialogOpen(true);
  };
  
  const validateForm = () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      toast.error('Harap isi semua field yang diperlukan');
      return false;
    }
    
    if (!selectedUserId) {
      // For new users, validate password
      if (!userForm.password) {
        toast.error('Password diperlukan');
        return false;
      }
      
      if (userForm.password.length < 6) {
        toast.error('Password harus minimal 6 karakter');
        return false;
      }
      
      if (userForm.password !== userForm.confirmPassword) {
        toast.error('Password tidak cocok');
        return false;
      }
    } else if (userForm.password) {
      // If changing password for existing user
      if (userForm.password.length < 6) {
        toast.error('Password harus minimal 6 karakter');
        return false;
      }
      
      if (userForm.password !== userForm.confirmPassword) {
        toast.error('Password tidak cocok');
        return false;
      }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      toast.error('Format email tidak valid');
      return false;
    }
    
    // Check for duplicate email
    const existingUser = users.find(u => u.email === userForm.email && u.id !== selectedUserId);
    if (existingUser) {
      toast.error('Email sudah digunakan');
      return false;
    }
    
    return true;
  };
  
  const handleSaveUser = () => {
    if (!validateForm()) {
      return;
    }
    
    if (selectedUserId) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === selectedUserId ? { 
          ...user, 
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
        } : user
      ));
      toast.success('Pengguna berhasil diperbarui');
    } else {
      // Create new user
      const newUser: User = {
        id: String(Date.now()),
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      };
      setUsers([...users, newUser]);
      toast.success('Pengguna baru berhasil ditambahkan');
    }
    
    setIsUserDialogOpen(false);
  };
  
  const handleDeleteUser = () => {
    if (!selectedUserId) return;
    
    // Don't allow deleting the last admin user
    const adminUsers = users.filter(u => u.role === 'admin');
    const isLastAdmin = adminUsers.length === 1 && adminUsers[0].id === selectedUserId;
    
    if (isLastAdmin) {
      toast.error('Tidak dapat menghapus admin terakhir');
      setIsDeleteDialogOpen(false);
      return;
    }
    
    setUsers(users.filter(user => user.id !== selectedUserId));
    toast.success('Pengguna berhasil dihapus');
    setIsDeleteDialogOpen(false);
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
          
          <div className="flex gap-2">
            <Button onClick={() => handleOpenUserDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
            </Button>
          </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Cari pengguna..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Nama</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Peran</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">{user.name}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'manager'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' 
                            ? 'Admin' 
                            : user.role === 'manager' 
                              ? 'Manajer' 
                              : 'Kasir'
                          }
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenUserDialog(user)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleOpenDeleteDialog(user.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      <UsersIcon className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                      <p>Tidak ada pengguna yang ditemukan.</p>
                      <Button 
                        variant="link"
                        onClick={() => handleOpenUserDialog()}
                        className="mt-2"
                      >
                        Tambah pengguna baru
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
      {/* User Form Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUserId ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input 
                id="name" 
                placeholder="Masukkan nama lengkap"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="nama@email.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Peran *</Label>
              <Select 
                value={userForm.role} 
                onValueChange={(value: UserRole) => setUserForm({ ...userForm, role: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manajer</SelectItem>
                    <SelectItem value="cashier">Kasir</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                {selectedUserId ? 'Password (Kosongkan jika tidak ingin mengubah)' : 'Password *'}
              </Label>
              <Input 
                id="password" 
                type="password"
                placeholder="Masukkan password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                placeholder="Konfirmasi password"
                value={userForm.confirmPassword}
                onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveUser}>{selectedUserId ? 'Perbarui' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Users;
