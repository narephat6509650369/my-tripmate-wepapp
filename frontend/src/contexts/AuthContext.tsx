// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/apiClient";
import { initSocket, disconnectSocket } from "../socket";

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// ============================================================================

const INITIAL_AUTH_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// HELPERS
// ============================================================================

const fetchCurrentUser = async (): Promise<User> => {
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) throw new Error("Not authenticated");
  const data = await res.json();
  return data.data as User;
};

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>(INITIAL_AUTH_STATE);

  const logoutRef = useRef<() => Promise<void>>();

  // 1. ตรวจ session ตอนโหลด app
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      if (window.location.pathname === '/auth/callback') {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. handle token refresh
  useEffect(() => {
    const handleTokenRefreshed = async () => {
      try {
        const user = await fetchCurrentUser();
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        await logoutRef.current?.();
      }
    };

    window.addEventListener("token:refreshed", handleTokenRefreshed);
    return () =>
      window.removeEventListener("token:refreshed", handleTokenRefreshed);
  }, []);

  // 3. socket lifecycle
  useEffect(() => {
    const userId = authState.user?.user_id;
    if (!userId) return;

    initSocket(userId);
    return () => disconnectSocket();
  }, [authState.user?.user_id]);

  // ========================================================================
  // ACTIONS
  // ========================================================================

  // login ถูกลบออก (ใช้ redirect แทน)

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      disconnectSocket();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  }, []);

  // ========================================================================
  // RENDER
  // ========================================================================

  const value: AuthContextType = {
    ...authState,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// HOOKS
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within <AuthProvider>");
  return context;
};

export const useIsTripOwner = (ownerId: string | null | undefined): boolean => {
  const { user } = useAuth();
  return Boolean(user && ownerId && user.user_id === ownerId);
};

export const useIsTripMember = (memberIds: string[]): boolean => {
  const { user } = useAuth();
  return Boolean(user && memberIds.includes(user.user_id));
};

export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
};

export default AuthContext;