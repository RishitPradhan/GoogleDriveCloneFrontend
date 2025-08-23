import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { isTokenExpired } from './utils';

// Ensure base URL points to same-origin '/api/v1' by default so cookies attach via Next rewrites
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export class ApiError extends Error {
  status: number;
  details?: any;
  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      // Let Axios set the appropriate Content-Type automatically
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: add Authorization header if we have an access token cookie
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('accessToken');
        if (token && !isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear any accessible cookies and redirect to login.
          // Note: httpOnly cookies won't be removed by js-cookie; server will clear on /auth/logout.
          try { Cookies.remove('accessToken'); Cookies.remove('refreshToken'); } catch {}
          // Do NOT hard redirect here to avoid infinite reload loops.
          // Let the AuthContext and page-level gating decide navigation.
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error?.message || error.response.data?.message || 'An error occurred';
      const status = error.response.status;
      const details = error.response.data?.error?.details ?? error.response.data;
      return new ApiError(message, status, details);
    } else if (error.request) {
      // Request was made but no response received
      return new ApiError('Network error - please check your connection', 0);
    } else {
      // Something else happened
      return new ApiError(error.message || 'An unexpected error occurred', -1);
    }
  }

  // Authentication methods
  async register(data: { email: string; password: string; name: string }) {
    return this.request({
      method: 'POST',
      url: '/auth/register',
      data,
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request({
      method: 'POST',
      url: '/auth/login',
      data,
    });
  }

  async logout() {
    return this.request({
      method: 'POST',
      url: '/auth/logout',
    });
  }

  async getCurrentUser() {
    return this.request({
      method: 'GET',
      url: '/auth/me',
    });
  }

  async googleSignIn(idToken: string) {
    return this.request({
      method: 'POST',
      url: '/auth/google',
      data: { idToken },
    });
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    username?: string;
  }) {
    return this.request({
      method: 'PUT',
      url: '/auth/profile',
      data,
    });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }) {
    return this.request({
      method: 'PUT',
      url: '/auth/password',
      data,
    });
  }

  // File methods
  async getFiles(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    folderId?: string;
    category?: string;
    search?: string;
  }) {
    return this.request({
      method: 'GET',
      url: '/files',
      params,
    });
  }

  async uploadFile(formData: FormData, onUploadProgress?: (progress: number) => void) {
    return this.request({
      method: 'POST',
      url: '/files/upload',
      data: formData,
      // Do not set Content-Type manually; Axios will add the correct boundary
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      },
    });
  }


  async getFile(id: string) {
    return this.request({
      method: 'GET',
      url: `/files/${id}`,
    });
  }

  async updateFile(id: string, data: { name?: string; folderId?: string }) {
    return this.request({
      method: 'PUT',
      url: `/files/${id}`,
      data,
    });
  }

  async deleteFile(id: string) {
    return this.request({
      method: 'DELETE',
      url: `/files/${id}`,
    });
  }

  // Trash endpoints (use unified trash routes)
  async getTrash(params?: { type?: 'file' | 'folder' | 'all'; page?: number; limit?: number }) {
    return this.request({ method: 'GET', url: '/trash', params });
  }
  async restoreItem(type: 'file' | 'folder', id: string) {
    return this.request({ method: 'POST', url: `/trash/${type}/${id}/restore` });
  }
  async permanentlyDeleteItem(type: 'file' | 'folder', id: string) {
    return this.request({ method: 'DELETE', url: `/trash/${type}/${id}` });
  }

  // Folder methods
  async getFolders(params?: {
    parentId?: string;
    includeFiles?: boolean;
    search?: string;
  }) {
    return this.request({
      method: 'GET',
      url: '/folders',
      params,
    });
  }

  async createFolder(data: { name: string; parentId?: string }) {
    return this.request({
      method: 'POST',
      url: '/folders',
      data,
    });
  }

  async getFolder(id: string) {
    return this.request({
      method: 'GET',
      url: `/folders/${id}`,
    });
  }

  async updateFolder(id: string, data: { name?: string; parentId?: string }) {
    return this.request({
      method: 'PUT',
      url: `/folders/${id}`,
      data,
    });
  }

  async deleteFolder(id: string) {
    return this.request({
      method: 'DELETE',
      url: `/folders/${id}`,
    });
  }

  // Folders restore/delete are via /trash routes (see above)

  // Share methods
  async shareFile(
    id: string,
    data: { permission: 'VIEW' | 'EDIT'; expiresDays?: number; allowDownload?: boolean; password?: string }
  ) {
    // Map UI permission values to API expected lowercase
    const mapped = {
      permission: data.permission === 'EDIT' ? 'edit' : 'view',
      expiryDays: data.expiresDays ?? 30,
      allowDownload: data.allowDownload ?? true,
      password: data.password,
    } as any;
    return this.request({ method: 'POST', url: `/sharing/files/${id}`, data: mapped });
  }

  async shareFolder(
    id: string,
    data: { permission: 'VIEW' | 'EDIT'; expiresDays?: number; password?: string }
  ) {
    // Backend supports 'view' or 'download' for folders. Map EDIT to 'download'.
    const mapped = {
      permission: data.permission === 'EDIT' ? 'download' : 'view',
      expiryDays: data.expiresDays ?? 30,
      password: data.password,
    } as any;
    return this.request({ method: 'POST', url: `/sharing/folders/${id}`, data: mapped });
  }

  async getSharedItem(token: string, password?: string) {
    return this.request({ method: 'GET', url: `/sharing/shared/${token}`, params: { password } });
  }

  async revokeShare(id: string, type: 'file' | 'folder') {
    return this.request({ method: 'DELETE', url: `/sharing/${id}`, params: { type } });
  }

  async getMyShares(params?: { page?: number; limit?: number }) {
    return this.request({ method: 'GET', url: '/sharing/my-shares', params });
  }

  // Search methods
  // Search
  async search(
    qOrParams:
      | string
      | {
    q: string;
    type?: 'file' | 'folder' | 'all';
    page?: number;
    limit?: number;
          sort?: string;
          order?: string;
        },
    extra?: { type?: 'file' | 'folder' | 'all'; page?: number; limit?: number; sortBy?: string; sortOrder?: string }
  ) {
    let params: any;
    if (typeof qOrParams === 'string') {
      params = {
        q: qOrParams,
        type: extra?.type ?? 'all',
        page: extra?.page,
        limit: extra?.limit,
        sort: extra?.sortBy,
        order: extra?.sortOrder,
      };
    } else {
      params = qOrParams;
    }
    const raw: any = await this.request({ method: 'GET', url: '/search', params });
    // Normalize to { files, folders, total }
    const results = raw?.data?.results || [];
    const files = results.filter((r: any) => r.type === 'file');
    const folders = results.filter((r: any) => r.type === 'folder');
    const total = raw?.data?.pagination?.total ?? results.length;
    return { files, folders, total };
  }

  async advancedSearch(data: {
    query?: string;
    type?: 'file' | 'folder' | 'all';
    mimeTypes?: string[];
    sizeMin?: number;
    sizeMax?: number;
    dateFrom?: string;
    dateTo?: string;
    folderId?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }) {
    return this.request({
      method: 'POST',
      url: '/search/advanced',
      data,
    });
  }

  async getSearchSuggestions(query: string, limit?: number) {
    // Fetch suggestions and a small set of results for richer UX
    const [suggestionsRes, quickRes]: any = await Promise.all([
      this.request({ method: 'GET', url: '/search/suggestions', params: { q: query, limit } }),
      this.request({ method: 'GET', url: '/search', params: { q: query, limit: 5, type: 'all', sort: 'relevance', order: 'desc' } }),
    ]);
    const results = quickRes?.data?.results || [];
    return {
      suggestions: suggestionsRes?.data?.suggestions || [],
      files: results.filter((r: any) => r.type === 'file'),
      folders: results.filter((r: any) => r.type === 'folder'),
    };
  }

  // Alias for components expecting 'searchSuggestions'
  async searchSuggestions(query: string, limit?: number) {
    return this.getSearchSuggestions(query, limit);
  }

  // Convenience helpers for Sidebar
  async getStorageInfo() {
    const me: any = await this.getCurrentUser();
    const used = Number(me?.data?.user?.storageUsed || 0);
    const total = Number(me?.data?.user?.storageLimit || 0);
    return { used, total };
  }

  async getQuickAccess() {
    // Backend endpoint not defined yet; return empty list for now
    return [] as any[];
  }
}

// Type definitions for API responses
export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
  thumbnailUrl?: string;
  description?: string;
  folderId?: string;
  isStarred: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface FolderItem {
  id: string;
  name: string;
  parentId?: string;
  itemCount?: number;
  isStarred: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export const apiClient = new ApiClient();
export default apiClient;
