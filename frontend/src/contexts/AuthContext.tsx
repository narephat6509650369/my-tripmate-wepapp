// src/contexts/AuthContext.tsx
// ============================================================================
// Authentication Context
// จัดการ session ด้วย httpOnly cookie (ไม่มี token ใน localStorage)
// ============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import type { ApiResponse } from "../types/index";
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

interface GoogleLoginResponse {
  user: Pick<User, "user_id" | "email">;
}

interface AuthContextType extends AuthState {
  login: (googleAccessToken: string, redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_AUTH_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// HELPERS (module-scoped, ไม่ต้องอยู่ใน component)
// ============================================================================

const fetchCurrentUser = async (): Promise<User> => {
  const res = await apiFetch("/auth/me");
  if (!res.ok) throw new Error("Failed to fetch user");
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

  // ── ใช้ ref เก็บ logout เพื่อป้องกัน stale closure ใน event listener ──────
  const logoutRef = useRef<() => Promise<void>>();

  // ── 1. ตรวจสอบ session เมื่อ app โหลด ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setAuthState({ user, isAuthenticated: true, isLoading: false });
        }
      } catch {
        if (!cancelled) {
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
          navigate("/login", { replace: true });
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── 2. re-fetch user หลัง token refresh (ใช้ ref ป้องกัน stale closure) ──
  useEffect(() => {
    const handleTokenRefreshed = async () => {
      try {
        const user = await fetchCurrentUser();
        setAuthState({ user, isAuthenticated: true, isLoading: false });
      } catch {
        // refresh token ล้มเหลว → force logout
        await logoutRef.current?.();
      }
    };

    window.addEventListener("token:refreshed", handleTokenRefreshed);
    return () => window.removeEventListener("token:refreshed", handleTokenRefreshed);
  }, []);

  // ── 3. จัดการ Socket lifecycle ตาม user ──────────────────────────────────
  useEffect(() => {
    const userId = authState.user?.user_id;
    if (!userId) return;

    initSocket(userId);
    return () => disconnectSocket();
  }, [authState.user?.user_id]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const login = useCallback(
    async (googleAccessToken: string, redirectPath = "/homepage"): Promise<void> => {
      const response = await apiFetch("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: googleAccessToken }),
      });

      const result: ApiResponse<GoogleLoginResponse> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Login failed");
      }

      // หลัง login สำเร็จ fetch user แบบเต็มเพื่อได้ full_name / avatar_url
      const user = await fetchCurrentUser();

      setAuthState({ user, isAuthenticated: true, isLoading: false });
      navigate(redirectPath);
    },
    [navigate]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (error) {
      // logout API ล้มเหลวก็ต้องล้าง state ฝั่ง client อยู่ดี
      console.error("Logout API error:", error);
    } finally {
      disconnectSocket();
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      navigate("/");
    }
  }, [navigate]);

  // sync ref ทุกครั้งที่ logout เปลี่ยน
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  const value: AuthContextType = {
    ...authState,
    login,
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

/** ตรวจสอบว่า user เป็น owner ของทริปหรือไม่ */
export const useIsTripOwner = (ownerId: string | null | undefined): boolean => {
  const { user } = useAuth();
  return Boolean(user && ownerId && user.user_id === ownerId);
};

/** ตรวจสอบว่า user เป็นสมาชิกของทริปหรือไม่ */
export const useIsTripMember = (memberIds: string[]): boolean => {
  const { user } = useAuth();
  return Boolean(user && memberIds.includes(user.user_id));
};

/** Redirect ไป login ถ้ายังไม่ได้ authenticate */
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
};

export default AuthContext;

// ============================================================================
// INPUT UTILITIES
// ============================================================================

export const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const sanitizeInput = (input: string): string =>
  input.trim().replace(/[<>]/g, "").slice(0, 255);