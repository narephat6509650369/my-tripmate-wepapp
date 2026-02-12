// ============================================================================
// frontend/src/services/authService.ts
// ✅ Authentication Service - แก้ไข imports ให้ถูกต้อง
// ============================================================================

import type { ApiResponse } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface GoogleLoginPayload {
  access_token: string;
}

export interface GoogleLoginResponse {
  token: string;
  user: {
    user_id: string;
    email: string;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const handleApiError = (error: any): ApiResponse => {
  console.error('Auth API Error:', error);
  
  return {
    success: false,
    code: 'CLIENT_ERROR',
    message: error.message || 'เกิดข้อผิดพลาด',
    error: {
      detail: error
    }
  };
};

// ============================================================================
// AUTH SERVICE
// ============================================================================

export const authService = {
  /**
   * POST /api/auth/google
   * Login with Google
   */
  googleLogin: async (accessToken: string): Promise<ApiResponse<GoogleLoginResponse>> => {
  try {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', 
      body: JSON.stringify({
        access_token: accessToken
      })
    });

    const result: ApiResponse<GoogleLoginResponse> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Login failed');
    }

    // ไม่ต้องเก็บ token แล้ว
    // cookie จะถูก set อัตโนมัติ

    console.log('✅ Login successful:', result.data.user.email);

    return result;

  } catch (error) {
    return handleApiError(error);
  }
},


  /**
   * Logout - Clear all authentication data
   */
  logout: async (): Promise<void> => {
    try {
      const result = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!result.ok) {
        throw new Error('Logout failed');
      }
      
      console.log('✅ Logout successful:',result);
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): {
    userId: string | null;
    email: string | null;
    token: string | null;
  } => {
    return {
      userId: localStorage.getItem('userId'),
      email: localStorage.getItem('userEmail'),
      token: localStorage.getItem('jwtToken')
    };
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('jwtToken');
    const userId = localStorage.getItem('userId');
    
    return !!(token && userId);
  },

  /**
   * Get auth token
   */
  getToken: (): string | null => {
    return localStorage.getItem('jwtToken');
  },

  /**
   * Check token expiration (JWT)
   */
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem('jwtToken');
    
    if (!token) {
      return true;
    }

    try {
      // JWT format: header.payload.signature
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      
      if (!exp) {
        // ถ้าไม่มี exp field ให้ถือว่ายังไม่หมดอายุ
        return false;
      }

      // exp เป็น Unix timestamp (seconds)
      const now = Math.floor(Date.now() / 1000);
      
      return now >= exp;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },

  /**
   * Check and refresh token validity
   */
  checkAndRefreshToken: async (): Promise<boolean> => {
    if (authService.isTokenExpired()) {
      console.warn('⚠️ Token expired, logging out');
      authService.logout();
      return false;
    }
    
    return true;
  }
};

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Get Authorization header string
 */
export const getAuthHeader = (): string => {
  const token = authService.getToken();
  return token ? `Bearer ${token}` : '';
};

/**
 * Get auth headers object
 */
export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const token = authService.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 255);
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default authService;