import { CONFIG } from "../config/app.config";

// ============================================================================
// Token Refresh Queue
// ป้องกัน race condition: ถ้ามี request หลายตัว 401 พร้อมกัน
// จะ refresh แค่ครั้งเดียวแล้วให้ทุกตัวรอผล
// ============================================================================
let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = async (): Promise<boolean> => {
  if (refreshPromise) {
    // มีการ refresh อยู่แล้ว → รอผลแทนที่จะยิงซ้ำ
    return refreshPromise;
  }

  refreshPromise = fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null; // reset หลังเสร็จ
    });

  return refreshPromise;
};

// ============================================================================
// Redirect to login (ไม่ใช้ router เพราะ apiFetch อยู่นอก React tree)
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
// apiFetch — wrapper หลัก
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

  // 1. ยิง request ครั้งแรก 
  let response = await fetch(fullUrl, baseOptions);

  // 2. ถ้าไม่ใช่ 401 หรือเป็น refresh endpoint เอง → return เลย 
  if (response.status !== 401 || endpoint.includes("/auth/refresh")) {
    return response;
  }

  // 3. พยายาม refresh token 
  console.log("🔄 Access token expired, attempting refresh...");
  const refreshed = await refreshAccessToken();

  if (!refreshed) {
    console.warn("❌ Refresh token invalid, redirecting to login...");
    redirectToLogin();
    throw new ApiError(401, "Session expired. Please login again.");
  }

  // 4. Retry original request ด้วย token ใหม่ 
  console.log("✅ Token refreshed, retrying request...");
  response = await fetch(fullUrl, baseOptions);

  //  5. ถ้า retry แล้วยัง 401 → session หมดจริงๆ 
  if (response.status === 401) {
    console.warn("❌ Still 401 after refresh, redirecting to login...");
    redirectToLogin();
    throw new ApiError(401, "Session expired. Please login again.");
  }

  return response;
};