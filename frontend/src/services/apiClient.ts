const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiFetch = async (url: string, options: RequestInit = {}) => {

  let response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: "include"
  });

  // access token หมด
  if (response.status === 401) {

    console.log("🔄 Access token expired, refreshing...");

    const refresh = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (refresh.ok) {
      console.log("✅ Token refreshed");

      // retry request
      response = await fetch(`${API_URL}${url}`, {
        ...options,
        credentials: "include"
      });

    } else {

      console.warn("❌ Refresh failed");

      window.location.href = "/";
      return response;
    }
  }

  return response;
};