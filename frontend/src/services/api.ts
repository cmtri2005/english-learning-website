/**
 * API Client
 * 
 * Centralized API client for all HTTP requests.
 * Handles authentication, token management, and request/response formatting.
 */

// ==================== API Response Types ====================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

// ==================== User & Auth Types ====================

export type UserRole = 'student' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  email_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

// ==================== API Client ====================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  /**
   * Kiểm tra token có hợp lệ không (chưa hết hạn)
   */
  isTokenValid(): boolean {
    if (!this.token) return false;

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      // Token expired
      if (exp <= now) {
        this.clearAuth();
        return false;
      }

      return true;
    } catch {
      // Invalid token format
      this.clearAuth();
      return false;
    }
  }

  /**
   * Kiểm tra token có sắp hết hạn không (< 2 phút)
   */
  private isTokenExpiringSoon(): boolean {
    if (!this.token) return false;

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000;

      return exp - now < twoMinutes;
    } catch {
      return false;
    }
  }

  /**
   * Tự động refresh token nếu cần
   */
  private async ensureValidToken(): Promise<void> {
    // Không có token thì không cần refresh
    if (!this.token) return;

    // Token còn valid, không cần refresh
    if (!this.isTokenExpiringSoon()) return;

    // Đang refresh thì đợi
    if (this.isRefreshing && this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    // Bắt đầu refresh
    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Thực hiện refresh token
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        this.setToken(data.data.token);
        return true;
      }

      // Refresh failed - clear auth
      this.clearAuth();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * Clear all auth data
   */
  private clearAuth(): void {
    this.setToken(null);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    // Kiểm tra token validity trước khi request
    if (this.token && !this.isTokenValid()) {
      this.clearAuth();
      throw new Error('Token expired');
    }

    // Tự động refresh token trước khi request nếu cần
    await this.ensureValidToken();

    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type for non-FormData requests
    // FormData will automatically set the correct Content-Type with boundary
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    let data = await response.json();

    // Nếu 401, thử refresh và retry (chỉ thử 1 lần, không dùng custom header để tránh CORS)
    if (response.status === 401 && !isRetry) {
      const refreshed = await this.performTokenRefresh();

      if (refreshed) {
        // Retry once with new token, using same logic (no extra custom headers)
        return this.request<T>(endpoint, options, true);
      } else {
        // Refresh failed, clear auth
        this.clearAuth();
        throw new Error('Authentication failed. Please login again.');
      }
    }

    if (!response.ok) {
      // If still 401 after retry, clear auth
      if (response.status === 401) {
        this.clearAuth();
      }
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<null>> {
    const token = this.token;
    const response = await this.request<null>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    this.setToken(null);
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/me', {
      method: 'GET',
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Google Login - send Firebase ID token to backend for verification
  async googleLogin(idToken: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  // Forgot password (quên mật khẩu) - gửi email để nhận link reset
  async forgotPassword(data: { email: string }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reset password - đặt lại mật khẩu với token
  async resetPassword(data: { token: string; password: string; confirmPassword: string }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Users endpoints
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/api/users', {
      method: 'GET',
    });
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    return this.request<User>(`/api/users/${id}`, {
      method: 'GET',
    });
  }

  // Blog endpoints - Generic request method for blog API
  async blogRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, options);
  }
}

export const api = new ApiClient(API_BASE_URL);

// ==================== Example Demo Response ====================

export interface DemoResponse {
  message: string;
}

