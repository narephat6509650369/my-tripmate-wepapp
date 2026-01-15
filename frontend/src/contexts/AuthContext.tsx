// ============================================================================
// frontend/src/contexts/AuthContext.tsx
// ✅ รองรับ Development Mode (Skip Auth)
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONFIG, MOCK_USER, MOCK_TOKEN } from '../config/app.config';

// ============================================================================
// TYPES
// ============================================================================

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
  login: (accessToken: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch (error) {
    console.error('❌ Token decode failed:', error);
    return true;
  }
};

const getUserIdFromToken = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.user_id || null;
  } catch (error) {
    console.error('❌ Cannot extract userId from token:', error);
    return null;
  }
};

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  // ============================================================================
  // ✅ Initialize Auth State
  // ============================================================================

  useEffect(() => {
    const initializeAuth = () => {
      try {
        // 🎭 Development Mode: Skip Auth
        if (CONFIG.SKIP_AUTH_IN_DEV) {
          console.log('🎭 Development Mode: Auto-login with mock user');
          
          localStorage.setItem('jwtToken', MOCK_TOKEN);
          localStorage.setItem('userId', MOCK_USER.user_id);
          localStorage.setItem('userEmail', MOCK_USER.email);
          
          setAuthState({
            user: MOCK_USER,
            token: MOCK_TOKEN,
            isAuthenticated: true,
            isLoading: false
          });
          return;
        }

        // 🔒 Production Mode: Normal Auth
        const token = localStorage.getItem('jwtToken');
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');

        if (!token) {
          console.log('ℹ️ No token found');
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }

        if (isTokenExpired(token)) {
          console.warn('⚠️ Token expired - clearing auth');
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          localStorage.removeItem('userAvatar');
          
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }

        if (userId && userEmail) {
          setAuthState({
            user: {
              user_id: userId,
              email: userEmail,
              full_name: localStorage.getItem('userName') || undefined,
              avatar_url: localStorage.getItem('userAvatar') || null
            },
            token,
            isAuthenticated: true,
            isLoading: false
          });
          console.log('✅ Auth initialized:', userEmail);
        } else {
          const extractedUserId = getUserIdFromToken(token);
          if (extractedUserId) {
            setAuthState({
              user: {
                user_id: extractedUserId,
                email: userEmail || 'unknown@email.com'
              },
              token,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            setAuthState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize auth:', error);
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    initializeAuth();
  }, []);

  // ============================================================================
  // ✅ Token Expiry Check (ข้ามใน Dev Mode)
  // ============================================================================

  useEffect(() => {
    if (CONFIG.SKIP_AUTH_IN_DEV) {
      return; // ข้ามการตรวจสอบใน Dev Mode
    }

    const checkTokenExpiry = () => {
      const token = localStorage.getItem('jwtToken');
      
      if (token && isTokenExpired(token)) {
        console.warn('⚠️ Token expired during session');
        logout();
        alert('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // ✅ Login
  // ============================================================================

  const login = useCallback(async (accessToken: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      console.log('🔐 Attempting Google login...');
      
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Login failed');
      }

      const { token, user } = result.data;

      if (isTokenExpired(token)) {
        throw new Error('Received expired token from server');
      }

      localStorage.setItem('jwtToken', token);
      localStorage.setItem('userId', user.user_id);
      localStorage.setItem('userEmail', user.email);

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
      navigate('/homepage');

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
  }, [navigate]);

  // ============================================================================
  // ✅ Logout
  // ============================================================================

  const logout = useCallback(() => {
    try {
      console.log('🚪 Logging out...');
      
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userAvatar');

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });

      console.log('✅ Logout successful');

      // 🎭 ใน Dev Mode ไม่ต้อง redirect
      if (!CONFIG.SKIP_AUTH_IN_DEV) {
        navigate('/');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }, [navigate]);

  // ============================================================================
  // ✅ Update User
  // ============================================================================

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null
    }));

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

  // ============================================================================
  // ✅ Check Auth
  // ============================================================================

  const checkAuth = useCallback((): boolean => {
    // 🎭 Dev Mode: Always authenticated
    if (CONFIG.SKIP_AUTH_IN_DEV) {
      return true;
    }

    const token = localStorage.getItem('jwtToken');
    
    if (!token) {
      return false;
    }

    if (isTokenExpired(token)) {
      console.warn('⚠️ Token expired in checkAuth');
      logout();
      return false;
    }
    
    return true;
  }, [logout]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

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

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

// ============================================================================
// HELPER HOOKS
// ============================================================================

export const useIsTripOwner = (ownerId: string | null | undefined): boolean => {
  const { user } = useAuth();
  
  if (!user || !ownerId) {
    return false;
  }
  
  return user.user_id === ownerId;
};

export const useIsTripMember = (memberIds: string[]): boolean => {
  const { user } = useAuth();
  
  if (!user) {
    return false;
  }
  
  return memberIds.includes(user.user_id);
};

export const useRequireAuth = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      const isValid = checkAuth();
      if (!isValid && !CONFIG.SKIP_AUTH_IN_DEV) {
        console.warn('⚠️ Not authenticated, redirecting to login');
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, checkAuth, navigate]);

  return { isAuthenticated, isLoading };
};

export default AuthContext;