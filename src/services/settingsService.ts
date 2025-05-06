
import { ApiResponse, get, post, put, del } from './api';
import { 
  StoreSettings, 
  AppSettings, 
  UserPreference, 
  DatabaseBackup 
} from '@/types';

// Store Settings Functions
export const getStoreSettings = async (): Promise<StoreSettings> => {
  const response = await get<StoreSettings>('/settings/store');
  return response.data as StoreSettings;
};

export const updateStoreSettings = async (settings: Partial<StoreSettings>): Promise<StoreSettings> => {
  const response = await put<StoreSettings>('/settings/store', settings);
  return response.data as StoreSettings;
};

export const uploadStoreLogo = async (logoFile: File): Promise<{ logo_path: string }> => {
  const formData = new FormData();
  formData.append('logo', logoFile);
  
  // Create a custom config for multipart/form-data
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  const response = await post<{ logo_path: string }>('/settings/store/logo', formData, config);
  return response.data as { logo_path: string };
};

// App Settings Functions
export const getAppSettings = async (): Promise<AppSettings> => {
  const response = await get<AppSettings>('/settings/application');
  return response.data as AppSettings;
};

export const updateAppSettings = async (settings: Partial<AppSettings>): Promise<AppSettings> => {
  const response = await put<AppSettings>('/settings/application', settings);
  return response.data as AppSettings;
};

// User Preferences Functions
export const getUserPreferences = async (userId?: string): Promise<UserPreference> => {
  const endpoint = userId ? `/settings/preferences/${userId}` : '/settings/preferences';
  const response = await get<UserPreference>(endpoint);
  return response.data as UserPreference;
};

export const updateUserPreferences = async (
  preferences: Partial<UserPreference>, 
  userId?: string
): Promise<UserPreference> => {
  const endpoint = userId ? `/settings/preferences/${userId}` : '/settings/preferences';
  const response = await put<UserPreference>(endpoint, preferences);
  return response.data as UserPreference;
};

// Database Backup Functions
export interface BackupParams {
  notes?: string;
  include_files?: boolean;
  include_media?: boolean;
}

export interface BackupListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export const createBackup = async (params?: BackupParams): Promise<DatabaseBackup> => {
  const response = await post<DatabaseBackup>('/settings/backups', params || {});
  return response.data as DatabaseBackup;
};

export const getBackupsList = async (params?: BackupListParams): Promise<{
  backups: DatabaseBackup[];
  total: number;
  page: number;
  limit: number;
}> => {
  const response = await get<{
    backups: DatabaseBackup[];
    total: number;
    page: number;
    limit: number;
  }>('/settings/backups', { params });
  
  return response.data as {
    backups: DatabaseBackup[];
    total: number;
    page: number;
    limit: number;
  };
};

export const getBackupDetails = async (backupId: string): Promise<DatabaseBackup> => {
  const response = await get<DatabaseBackup>(`/settings/backups/${backupId}`);
  return response.data as DatabaseBackup;
};

export const deleteBackup = async (backupId: string): Promise<{ success: boolean }> => {
  const response = await del<{ success: boolean }>(`/settings/backups/${backupId}`);
  return response.data as { success: boolean };
};

export const restoreFromBackup = async (backupId: string): Promise<{ success: boolean; message: string }> => {
  const response = await post<{ success: boolean; message: string }>(
    `/settings/backups/${backupId}/restore`
  );
  return response.data as { success: boolean; message: string };
};

// This function generates a download URL (but doesn't actually download the file)
// The frontend will use this URL in an <a> tag or window.open() call
export const getBackupDownloadUrl = (backupId: string): string => {
  return `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/settings/backups/${backupId}/download`;
};

// This function helps download a backup directly
export const downloadBackup = async (backupId: string): Promise<void> => {
  const downloadUrl = getBackupDownloadUrl(backupId);
  
  // Open the download URL in a new tab
  window.open(downloadUrl, '_blank');
};

// Get all settings at once (for initial app load optimization)
export const getAllSettings = async (): Promise<{
  store: StoreSettings;
  app: AppSettings;
  user_preferences: UserPreference;
}> => {
  const response = await get<{
    store: StoreSettings;
    app: AppSettings;
    user_preferences: UserPreference;
  }>('/settings/all');
  
  return response.data as {
    store: StoreSettings;
    app: AppSettings;
    user_preferences: UserPreference;
  };
};
