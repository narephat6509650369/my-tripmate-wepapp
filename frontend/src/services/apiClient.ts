import { CONFIG } from "../config/app.config";

// ============================================================================
// Redirect to login
// ============================================================================
const redirectToLogin = () => {
  const currentPath = window.location.pathname + window.location.search;
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
export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const endpoint = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = `${CONFIG.API_BASE_URL}${endpoint}`;

  const baseOptions: RequestInit = {
    ...options,
    credentials: "include", 
  };

  const response = await fetch(fullUrl, baseOptions);

  // ถ้า unauthorized → redirect ไป login
  if (response.status === 401) {
    console.warn("❌ Unauthorized, redirecting to login...");
    redirectToLogin();
    throw new ApiError(401, "Unauthorized");
  }

  return response;
};