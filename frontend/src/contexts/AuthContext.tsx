// frontend/src/contexts/AuthContext.tsx
// ✅ Authentication Context สำหรับจัดการ User State ทั้งระบบ

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface GoogleLoginResponse {
  user: {
    user_id: string;
    email: string;
  };
}

interface AuthContextType extends AuthState {
  login: (accessToken: string, redirectPath?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// ============== CONTEXT ==============
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============== PROVIDER ==============
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // ✅ Initialize auth state from localStorage
  useEffect(() => {
  const initializeAuth = async () => {

    if (authState.isAuthenticated) {
      return;
    }

    try {
      const API_URL =
        import.meta.env.VITE_API_BASE_URL ||
        'http://localhost:5000/api';

      const res = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include"
      });

      if (!res.ok) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        return;
      }

      const result = await res.json();

      setAuthState({
        user: result.data,
        isAuthenticated: true,
        isLoading: false
      });

    } catch {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  initializeAuth();
}, []);


  // ✅ Login with Google
  const login = async (accessToken: string,redirectPath?: string): Promise<void> => {
    const API_URL = import.meta.env.VITE_API_BASE_URL ||"http://localhost:5000/api";
    const response = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        access_token: accessToken
      })
    });

  const result: ApiResponse<GoogleLoginResponse> =
    await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.message || "Login failed");
  }

  setAuthState({
    user: {
      user_id: result.data.user.user_id,
      email: result.data.user.email
    },
    isAuthenticated: true,
    isLoading: false
  });

  console.log("✅ Login successful:", result.data.user.email);

  navigate(redirectPath || "/homepage");
};

const logout = async (): Promise<void> => {
  try {
    const API_URL =
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:5000/api";

    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });

  } catch (error) {
    console.error("Logout API error:", error);
  }

  setAuthState({
    user: null,
    isAuthenticated: false,
    isLoading: false
  });

  navigate("/");
};



  // ✅ Update user data
  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null
    }));
  }, []);

 
  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
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