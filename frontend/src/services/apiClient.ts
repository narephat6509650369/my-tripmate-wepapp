import { CONFIG } from "../config/app.config";

const API_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_URL) {
  throw new Error("❌ VITE_API_BASE_URL is not defined");
}

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const endpoint = url.startsWith("/") ? url : `/${url}`;

  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include", // ต้องมีเพื่อส่ง cookie
  });

  if (response.status === 401 && !endpoint.includes("/auth/refresh")) {
    console.log("🔄 Access token expired");

    const refresh = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refresh.ok) {
      console.log("✅ Token refreshed, retry original request");
      return fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
      });
    } else {
      const error = new Error("Refresh token failed");
      (error as any).status = 401;
      throw error;
    }
  }

  return response;
};