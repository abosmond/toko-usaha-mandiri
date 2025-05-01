
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from '@/components/ui/sonner';

// API response interface that matches Laravel's response structure
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Config constants
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'pos_auth_token';

// Create axios instance with default settings
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies/CSRF when using Sanctum
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common error scenarios
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const { response } = error;
    
    if (response) {
      const statusCode = response.status;
      const data = response.data as ApiResponse;
      
      switch (statusCode) {
        case 401:
          // Unauthorized - clear token and redirect to login
          clearToken();
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          window.location.href = '/login';
          break;
        
        case 403:
          // Forbidden
          toast.error('Anda tidak memiliki izin untuk melakukan tindakan ini.');
          break;
        
        case 422:
          // Validation errors
          if (data.errors) {
            // Get the first error message from each field
            const errorMessages = Object.values(data.errors)
              .map(errors => errors[0])
              .join(', ');
            
            toast.error(`Validasi gagal: ${errorMessages}`);
          } else {
            toast.error(data.message || 'Terjadi kesalahan validasi data.');
          }
          break;
        
        case 404:
          toast.error('Data yang diminta tidak ditemukan.');
          break;
        
        case 500:
          toast.error('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
          break;
        
        default:
          toast.error(data.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } else {
      // Network error or no response from server
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    }
    
    return Promise.reject(error);
  }
);

// Token management
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// API request methods with proper typing
export const get = async <T = any>(
  url: string, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await api.get<ApiResponse<T>>(url, config);
  return response.data;
};

export const post = async <T = any>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await api.post<ApiResponse<T>>(url, data, config);
  return response.data;
};

export const put = async <T = any>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await api.put<ApiResponse<T>>(url, data, config);
  return response.data;
};

export const patch = async <T = any>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await api.patch<ApiResponse<T>>(url, data, config);
  return response.data;
};

export const del = async <T = any>(
  url: string, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await api.delete<ApiResponse<T>>(url, config);
  return response.data;
};

// Export the axios instance for more complex use cases
export default api;
