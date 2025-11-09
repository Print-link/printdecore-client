import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  _id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (fullName: string, email: string, password: string, phoneNumber: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Set user immediately from localStorage for instant authentication
            // This prevents redirect to login on page refresh
            setUser(parsedUser);
            setIsLoading(false); // Allow app to render while we verify in background
            
            // Verify token in background (non-blocking)
            // Only update if verification succeeds, don't clear on network errors
            try {
              const response = await apiService.getProfile();
              if (response.success && response.data) {
                const userData = response.data.client;
                const updatedUser: User = {
                  _id: userData._id,
                  email: userData.email,
                  fullName: userData.fullName,
                  phoneNumber: userData.phoneNumber,
                  isActive: userData.isActive,
                  lastLogin: userData.lastLogin,
                };
                setUser(updatedUser);
                // Update localStorage with fresh user data
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
              // If response.success is false but not a 401, don't clear user
              // Let subsequent API calls handle auth errors
            } catch (error: any) {
              // Check for 401 status code specifically
              if (error.status === 401 || (error.message && (
                error.message.includes('401') || 
                error.message.includes('Unauthorized')
              ))) {
                console.warn('Token invalid (401), clearing auth state');
                setUser(null);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                // Navigate to login after clearing state (avoid redirect loop)
                setTimeout(() => {
                  window.location.href = '/login';
                }, 100);
              } else {
                // Network or other errors - keep user logged in, token might still be valid
                console.warn('Token verification failed (network/server error?), keeping user logged in:', error);
                // Don't clear user on network errors - token might be valid
              }
            }
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            // Invalid JSON in localStorage, clear it
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setIsLoading(false);
          }
        } else {
          // No stored auth, ensure clean state
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        // Clear potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const userData = response.data.client;
        const updatedUser: User = {
          _id: userData._id,
          email: userData.email,
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          isActive: userData.isActive,
          lastLogin: userData.lastLogin,
        };
        
        // Update state
        setUser(updatedUser);
        
        // Persist updated user data to localStorage
        try {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (storageError) {
          console.error('Error updating user in localStorage:', storageError);
          // Don't throw, as state is already updated
        }
      } else {
        throw new Error('Failed to refresh user profile');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might be logged out on server
      // Don't clear localStorage immediately, let the next API call handle it
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        const { client, token } = response.data;
        
        // Store token securely
        localStorage.setItem('token', token);
        
        // Prepare user data
        const userData: User = {
          _id: client._id,
          email: client.email,
          fullName: client.fullName,
          phoneNumber: client.phoneNumber,
          isActive: client.isActive,
          ...(client.lastLogin && { lastLogin: client.lastLogin }),
        };
        
        // Update state and persist to localStorage
        setUser(userData);
        try {
          localStorage.setItem('user', JSON.stringify(userData));
          // Store last login email for convenience (optional)
          localStorage.setItem('lastLoginEmail', email);
        } catch (storageError) {
          console.error('Error saving user to localStorage:', storageError);
          // Don't fail login if localStorage write fails, but log it
        }
        
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (fullName: string, email: string, password: string, phoneNumber: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiService.register(fullName, email, password, phoneNumber);
      
      if (response.success && response.data) {
        const { client, token } = response.data;
        
        // Store token securely
        localStorage.setItem('token', token);
        
        // Prepare user data
        const userData: User = {
          _id: client._id,
          email: client.email,
          fullName: client.fullName,
          phoneNumber: client.phoneNumber,
          isActive: client.isActive,
          // lastLogin is not returned on registration
        };
        
        // Update state and persist to localStorage
        setUser(userData);
        try {
          localStorage.setItem('user', JSON.stringify(userData));
          // Store email for convenience
          localStorage.setItem('lastLoginEmail', email);
        } catch (storageError) {
          console.error('Error saving user to localStorage:', storageError);
          // Don't fail registration if localStorage write fails, but log it
        }
        
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      // Check if it's a validation error
      if (error.message && error.message.includes('already exists')) {
        return { success: false, message: 'Email already registered' };
      }
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    // Clear all auth-related data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Note: We keep 'lastLoginEmail' so user doesn't have to retype it
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

