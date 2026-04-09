import { CONFIG } from "../config/app.config";

// ============================================================================
// Redirect to login
// ============================================================================
const redirectToLogin = () => {
  const currentPath = window.location.pathname + window.location.search;

  if (window.location.pathname === "/login") return;

  if (window.location.search.includes("redirect=")) return;

  window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
};

// ============================================================================
// Custom Error
// ============================================================================
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: Response
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ============================================================================
// apiFetch — simplified for session-based auth
// ============================================================================
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const endpoint = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = `${CONFIG.API_BASE_URL}${endpoint}`;

  const response = await fetch(fullUrl, {
    ...options,
    credentials: "include",
  });

  //  access token หมด
  if (response.status === 401) {
    console.warn("🔄 Access token expired, refreshing...");

    // ถ้า refresh อยู่แล้ว → รอ
    if (!isRefreshing) {
      isRefreshing = true;

      refreshPromise = fetch(`${CONFIG.API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Refresh failed");
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    try {
      await refreshPromise;

      // retry request เดิม
      return await fetch(fullUrl, {
        ...options,
        credentials: "include",
      });

    } catch (err) {
      console.warn("❌ Refresh failed → redirect login");

      redirectToLogin();
      throw new ApiError(401, "Unauthorized");
    }
  }

  return response;
};