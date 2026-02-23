// frontend/src/contexts/AuthContext.tsx
// ✅ Authentication Context สำหรับจัดการ User State ทั้งระบบ

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { redirect, useNavigate } from 'react-router-dom';
import type { ApiResponse } from '../types/index';

// ============== TYPES ==============
export interface User {
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string | null;   
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface GoogleLoginResponse {
  token: string;
  user: {
    user_id: string;
    email: string;
  };
}

interface AuthContextType extends AuthState {
  login: (accessToken: string, redirectPath?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => boolean;
}

// ============== CONTEXT ==============
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============== PROVIDER ==============
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname;
  let inviteCode = queryParams.get("inviteCode");

  // Handle path param `/join/:inviteCode`
  const match = pathname.match(/^\/join\/([^\/]+)/);
  if (!inviteCode && match) {
    inviteCode = match[1];
  }

  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  // ✅ Initialize auth state from localStorage
  // useEffect(() => {
  //   const initializeAuth = () => {
  //     try {
  //       const token = localStorage.getItem('jwtToken');
  //       const userId = localStorage.getItem('userId');
  //       const userEmail = localStorage.getItem('userEmail');

  //       if (!token) {
  //         console.warn('⚠️ No token found, redirecting to login');
  //         if (pathname !== '/login') {
  //         if (inviteCode) navigate(`/login?redirect=/join/${inviteCode}`);
  //           else navigate('/login');
  //         }
  //         return;
  //       }

  //       if (token && userId && userEmail) {
  //         setAuthState({
  //           user: {
  //             user_id: userId,
  //             email: userEmail,
  //             full_name: localStorage.getItem('userName') || undefined,
  //             avatar_url: localStorage.getItem('userAvatar') || null
  //           },
  //           token,
  //           isAuthenticated: true,
  //           isLoading: false
  //         });
  //       } else {
  //         setAuthState({
  //           user: null,
  //           token: null,
  //           isAuthenticated: false,
  //           isLoading: false
  //         });
  //       }
  //     } catch (error) {
  //       console.error('Failed to initialize auth:', error);
  //       setAuthState({
  //         user: null,
  //         token: null,
  //         isAuthenticated: false,
  //         isLoading: false
  //       });
  //     }
  //   };

  //   initializeAuth();
  // }, []);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        // 🔥 สำหรับ development: ข้าม auth check
        setAuthState({
          user: {
            user_id: 'mock-user-123',
            email: 'mock@example.com',
            full_name: 'Mock User',
            avatar_url: null
          },
          token: 'mock-token',
          isAuthenticated: true,
          isLoading: false
        });
        
        console.log('✅ Mock auth initialized');

        /* 
        // โค้ดเดิม - comment ไว้ก่อน
        const token = localStorage.getItem('jwtToken');
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');

        if (!token) {
          console.warn('⚠️ No token found, redirecting to login');
          if (pathname !== '/login') {
            if (inviteCode) navigate(`/login?redirect=/join/${inviteCode}`);
            else navigate('/login');
          }
          return;
        }
        */

      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };

    initializeAuth();
  }, []);

  // ✅ Login with Google
  const login = async (accessToken: string, redirectPath?: string): Promise<void> => {
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
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
      if (redirectPath) navigate(redirectPath);
      else {
        console.log('🔄 No redirect path, navigating to homepage');
        navigate('/homepage');
      }
  
    } catch (error) {
      throw error;
    }
  }
  /*
  const login = useCallback(async (accessToken: string, redirectPath?: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken
        })
      });

      const result: ApiResponse<GoogleLoginResponse> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Login failed');
      }

      const { token, user } = result.data;

      // Save to localStorage
      localStorage.setItem('jwtToken', token);
      localStorage.setItem('userId', user.user_id);
      localStorage.setItem('userEmail', user.email);

      // Update state
      setAuthState({
        user: {
          user_id: user.user_id,
          email: user.email
        },
        token,
        isAuthenticated: true,
        isLoading: false
      });

      console.log('✅ Login successful:', user.email);
      if (redirectPath) navigate(redirectPath);
      else {
        console.log('🔄 No redirect path, navigating to homepage');
        navigate('/homepage');
      }

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });

      throw error;
    }
  }, [navigate]);*/

  // ✅ Logout
  /*
  const logout = useCallback(() => {
    try {
      // Clear localStorage
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userAvatar');

      // Clear state
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });

      console.log('✅ Logout successful');

      // Redirect to login
      navigate('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }, [navigate]);*/

  const logout = async (): Promise<void> => {
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const result = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!result.ok) {
        throw new Error('Logout failed');
      }
      
      console.log('✅ Logout successful:',result);
      navigate('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };


  // ✅ Update user data
  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null
    }));

    // Update localStorage
    if (userData.full_name) {
      localStorage.setItem('userName', userData.full_name);
    }
    if (userData.avatar_url !== undefined) {
      if (userData.avatar_url) {
        localStorage.setItem('userAvatar', userData.avatar_url);
      } else {
        localStorage.removeItem('userAvatar');
      }
    }
  }, []);

  // ✅ Check if authenticated
  const checkAuth = useCallback((): boolean => {
    const token = localStorage.getItem('jwtToken');
    const userId = localStorage.getItem('userId');
    
    const isValid = !!(token && userId);
    
    if (!isValid && authState.isAuthenticated) {
      // Token หมดอายุหรือถูกลบ → logout
      logout();
    }
    
    return isValid;
  }, [authState.isAuthenticated, logout]);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============== HOOK ==============
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

// ============== HELPER HOOKS ==============

/**
 * Hook สำหรับตรวจสอบว่า user เป็น owner ของทริปหรือไม่
 */
export const useIsTripOwner = (ownerId: string | null | undefined): boolean => {
  const { user } = useAuth();
  
  if (!user || !ownerId) {
    return false;
  }
  
  return user.user_id === ownerId;
};

/**
 * Hook สำหรับตรวจสอบว่า user เป็นสมาชิกของทริปหรือไม่
 */
export const useIsTripMember = (memberIds: string[]): boolean => {
  const { user } = useAuth();
  
  if (!user) {
    return false;
  }
  
  return memberIds.includes(user.user_id);
};

/**
 * Hook สำหรับ redirect ถ้ายังไม่ได้ login
 */
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.warn('⚠️ Not authenticated, redirecting to login');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
};

export default AuthContext;

// ============== AUTH UTILITIES ==============

const isTokenExpired = (): boolean => {
  const token = localStorage.getItem('jwtToken');
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Math.floor(Date.now() / 1000) >= payload.exp;
  } catch {
    return true;
  }
};

export const getAuthHeader = (): string => {
  const token = localStorage.getItem('jwtToken');
  return token ? `Bearer ${token}` : '';
};

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('jwtToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '').slice(0, 255);
};