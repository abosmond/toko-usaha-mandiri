
import { User, UserRole } from '@/types';
import { get, post, put, patch, del, ApiResponse } from './api';

// Interfaces for request and response data
export interface UserListParams {
  page?: number;
  perPage?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  data: User[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: UserRole;
  avatar?: string | File;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  avatar?: string | File;
  isActive?: boolean;
}

export interface ChangePasswordData {
  current_password?: string;
  password: string;
  password_confirmation: string;
  userId?: string; // Used when admin changes user's password
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  avatar?: string | File;
}

export interface RoleData {
  id: string;
  name: string;
  permissions?: string[];
}

/**
 * Get paginated list of users with optional filters
 * @param params - Filter and pagination parameters
 * @returns Promise with paginated user list
 */
export const getUsers = async (params: UserListParams = {}): Promise<UserListResponse> => {
  const response = await get<UserListResponse>('/users', { params });
  
  if (response.status && response.data) {
    return response.data;
  }
  
  throw new Error(response.message || 'Failed to fetch users');
};

/**
 * Get user details by ID
 * @param id - User ID
 * @returns Promise with user data
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await get<User>(`/users/${id}`);
  
  if (response.status && response.data) {
    return response.data;
  }
  
  throw new Error(response.message || 'Failed to fetch user details');
};

/**
 * Create a new user (admin only)
 * @param userData - User data for creation
 * @returns Promise with created user
 */
export const createUser = async (userData: CreateUserData): Promise<User> => {
  // Handle file upload if avatar is a File object
  let data = userData;
  
  if (userData.avatar instanceof File) {
    const formData = new FormData();
    Object.entries(userData).forEach(([key, value]) => {
      if (key === 'avatar' && value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });
    
    data = formData as any;
  }
  
  const response = await post<User>('/users', data);
  
  if (response.status && response.data) {
    return response.data;
  }
  
  throw new Error(response.message || 'Failed to create user');
};

/**
 * Update existing user data
 * @param id - User ID
 * @param userData - User data to update
 * @returns Promise with updated user
 */
export const updateUser = async (id: string, userData: UpdateUserData): Promise<User> => {
  // Handle file upload if avatar is a File object
  let data = userData;
  
  if (userData.avatar instanceof File) {
    const formData = new FormData();
    Object.entries(userData).forEach(([key, value]) => {
      if (key === 'avatar' && value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    
    data = formData as any;
  }
  
  const response = await put<User>(`/users/${id}`, data);
  
  if (response.status && response.data) {
    return response.data;
  }
  
  throw new Error(response.message || 'Failed to update user');
};

/**
 * Delete a user
 * @param id - User ID
 * @returns Promise with success message
 */
export const deleteUser = async (id: string): Promise<string> => {
  const response = await del<{message: string}>(`/users/${id}`);
  
  if (response.status) {
    return response.message;
  }
  
  throw new Error(response.message || 'Failed to delete user');
};

/**
 * Activate or deactivate a user
 * @param id - User ID
 * @param isActive - Activation status
 * @returns Promise with updated user
 */
export const toggleUserStatus = async (id: string, isActive: boolean): Promise<User> => {
  const response = await patch<User>(`/users/${id}/status`, { isActive });
  
  if (response.status && response.data) {
    return response.data;
  }
  
  throw new Error(response.message || 'Failed to update user status');
};

/**
 * Change user password (works for both admin changing user password and user changing own password)
 * @param data - Password change data
 * @param userId - Optional user ID (used when admin changes user password)
 * @returns Promise with success message
 */
export const changeUserPassword = async (data: ChangePasswordData): Promise<string> => {
  const userId = data.userId;
  const passwordData = { ...data };
  delete passwordData.userId;
  
  const endpoint = userId ? `/users/${userId}/password` : '/auth/password';
  const response = await post<{message: string}>(endpoint, passwordData);
  
  if (response.status) {
    return response.message;
  }
  
  throw new Error(response.message || 'Failed to change password');
};

/**
 * Get available user roles
 * @returns Promise with roles list
 */
export const getRoles = async (): Promise<RoleData[]> => {
  const response = await get<RoleData[]>('/roles');
  
  if (response.status && response.data) {
    return response.data;
  }
  
  throw new Error(response.message || 'Failed to fetch roles');
};

/**
 * Get current user profile
 * @returns Promise with user profile data
 */
export const getCurrentUserProfile = async (): Promise<User> => {
  const response = await get<User>('/auth/profile');
  
  if (response.status && response.data) {
    return response.data;
  }
  
  throw new Error(response.message || 'Failed to fetch user profile');
};

/**
 * Update current user profile
 * @param profileData - Profile data to update
 * @returns Promise with updated user profile
 */
export const updateUserProfile = async (profileData: ProfileUpdateData): Promise<User> => {
  // Handle file upload if avatar is a File object
  let data = profileData;
  
  if (profileData.avatar instanceof File) {
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (key === 'avatar' && value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    
    data = formData as any;
  }
  
  const response = await post<User>('/auth/profile', data);
  
  if (response.status && response.data) {
    return response.data;
  }
  
  throw new Error(response.message || 'Failed to update profile');
};

// Export as default object for easier import
export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changeUserPassword,
  getRoles,
  getCurrentUserProfile,
  updateUserProfile
};
