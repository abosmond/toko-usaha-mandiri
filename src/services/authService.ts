
import { User } from '@/types';
import { get, post, del, ApiResponse, setToken, clearToken, getToken, isAuthenticated as isAuthToken } from './api';

// Interface for login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Interface for registration data
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'admin' | 'manager' | 'cashier';
}

// Interface for change password data
export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

// Interface for login response from backend
export interface LoginResponse {
  token: string;
  user: User;
}

// User storage key in localStorage
const USER_STORAGE_KEY = 'pos_user_data';

/**
 * Login user with email and password
 * @param credentials - Login credentials (email, password)
 * @returns Promise with login response
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await post<LoginResponse>('/auth/login', credentials);
  
  if (response.status && response.data) {
    // Set the auth token for future API calls
    setToken(response.data.token);
    
    // Store user data in localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
    
    return response.data.user;
  }
  
  throw new Error(response.message || 'Login failed');
};

/**
 * Logout current user
 */
export const logout = async (): Promise<void> => {
  try {
    // Call the logout endpoint to invalidate token on server
    await post('/auth/logout');
  } catch (error) {
    console.error('Error during logout:', error);
    // Continue with logout even if API call fails
  } finally {
    // Clear token and user data regardless of API response
    clearToken();
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

/**
 * Get current user data from localStorage or from backend if needed
 * @returns Promise with User object
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  
  if (storedUser) {
    try {
      return JSON.parse(storedUser) as User;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      clearUserData();
      return null;
    }
  }
  
  // If we have a token but no user data, try to fetch it
  if (isAuthToken()) {
    try {
      const response = await get<User>('/auth/user');
      if (response.status && response.data) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      clearUserData();
    }
  }
  
  return null;
};

/**
 * Register a new user (admin only)
 * @param userData - User registration data
 * @returns Promise with new User object
 */
export const register = async (userData: RegisterData): Promise<User> => {
  const response = await post<User>('/auth/register', userData);
  
  if (response.status && response.data) {
    return response.data;
  }
  
  throw new Error(response.message || 'Registration failed');
};

/**
 * Change user password
 * @param passwordData - Password change data
 * @returns Promise with success message
 */
export const changePassword = async (passwordData: ChangePasswordData): Promise<string> => {
  const response = await post<{message: string}>('/auth/password/change', passwordData);
  
  if (response.status) {
    return response.message;
  }
  
  throw new Error(response.message || 'Password change failed');
};

/**
 * Check if current user has specified role
 * @param roles - Role or array of roles to check
 * @returns Boolean indicating if user has the role
 */
export const hasRole = (roles: string | string[]): boolean => {
  const user = getUserFromStorage();
  
  if (!user) return false;
  
  const rolesToCheck = Array.isArray(roles) ? roles : [roles];
  return rolesToCheck.includes(user.role);
};

/**
 * Get user from storage without async call
 * @returns User object or null
 */
export const getUserFromStorage = (): User | null => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  
  if (storedUser) {
    try {
      return JSON.parse(storedUser) as User;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }
  
  return null;
};

/**
 * Check if user is authenticated by checking token and stored user data
 * @returns Boolean indicating if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return isAuthToken() && !!getUserFromStorage();
};

/**
 * Clear all user data from storage
 */
const clearUserData = (): void => {
  clearToken();
  localStorage.removeItem(USER_STORAGE_KEY);
};

/**
 * Update user profile information
 * @param userData - Partial user data to update
 * @returns Promise with updated User object
 */
export const updateProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await post<User>('/auth/profile/update', userData);
  
  if (response.status && response.data) {
    // Update stored user data
    const currentUser = getUserFromStorage();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
    
    return response.data;
  }
  
  throw new Error(response.message || 'Profile update failed');
};

// Export as default object for easier import
export default {
  login,
  logout,
  register,
  getCurrentUser,
  changePassword,
  hasRole,
  isAuthenticated,
  getUserFromStorage,
  updateProfile
};
