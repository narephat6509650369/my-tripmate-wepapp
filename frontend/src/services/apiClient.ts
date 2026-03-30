const API_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_URL) {
  throw new Error("❌ VITE_API_BASE_URL is not defined");
}

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const endpoint = url.startsWith("/") ? url : `/${url}`;

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include"
  });

  // re ถ้า 401 -> ลอง refresh token
  if (response.status === 401 && !endpoint.includes("/auth/refresh")) {
    console.log("🔄 Access token expired");

    const refresh = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (refresh.ok) {
      console.log("✅ Token refreshed, retry original request");

      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include"
      });

      return response;
    } else {
      console.warn("❌ Refresh failed");
      // ❌ อย่า redirect ที่นี่ ให้ AuthContext handle
      const error = new Error("Refresh token failed");
      (error as any).status = 401;
      throw error;
    }
  }

  return response;
};