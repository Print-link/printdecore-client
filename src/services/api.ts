const BASE_URL = 'http://localhost:3000/api/clients';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        // Create error with status info for better error handling
        const error: any = new Error(data.message || data.error || 'Request failed');
        error.status = response.status;
        error.statusText = response.statusText;
        
        // Handle 401 - Unauthorized (token expired/invalid)
        // Don't auto-redirect here - let the calling code decide
        // Auto-redirect was causing issues on page refresh
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Only redirect if not during initialization (let AuthContext handle it)
          // We'll check if we're in a navigation context
        }
        
        throw error;
      }

      return data;
    } catch (error: any) {
      // Preserve status info if it exists
      if (error.status) {
        throw error;
      }
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(fullName: string, email: string, password: string, phoneNumber: string) {
    const response = await this.request<{
      client: {
        _id: string;
        email: string;
        fullName: string;
        phoneNumber: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
      token: string;
    }>('/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, phoneNumber }),
    });
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      client: {
        _id: string;
        email: string;
        fullName: string;
        phoneNumber: string;
        isActive: boolean;
        lastLogin?: string;
        createdAt: string;
        updatedAt: string;
      };
      token: string;
    }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  }

  async getProfile() {
    const response = await this.request<{
      client: {
        _id: string;
        email: string;
        fullName: string;
        phoneNumber: string;
        isActive: boolean;
        lastLogin?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>('/profile', {
      method: 'GET',
    });
    return response;
  }

  async updateProfile(fullName?: string, email?: string, phoneNumber?: string) {
    const body: any = {};
    if (fullName) body.fullName = fullName;
    if (email) body.email = email;
    if (phoneNumber) body.phoneNumber = phoneNumber;

    const response = await this.request<{
      client: {
        _id: string;
        email: string;
        fullName: string;
        phoneNumber: string;
        isActive: boolean;
        lastLogin?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return response;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.request('/profile/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response;
  }

  // Upload file with FormData (for print jobs)
  async uploadFile(formData: FormData, endpoint: string = '/print/submit') {
    const token = this.getToken();
    
    try {
      // Don't set Content-Type header for FormData - browser will set it with boundary
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:3000/api${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Create error with status info for better error handling
        const error: any = new Error(data.message || data.error || 'Upload failed');
        error.status = response.status;
        error.statusText = response.statusText;
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirect to login on 401 for uploads (not during initialization)
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('File Upload Error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

