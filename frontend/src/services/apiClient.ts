const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiFetch = async (url: string, options: RequestInit = {}) => {

  const endpoint = url.startsWith("/") ? url : `/${url}`;

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include"
  });

  if (response.status === 401 && !endpoint.includes("/auth/refresh")) {

    console.log("🔄 Access token expired");

    const refreshEndpoint = "/auth/refresh";

    const refresh = await fetch(`${API_URL}${refreshEndpoint}`, {
      method: "POST",
      credentials: "include"
    });

    if (refresh.ok) {

      console.log("✅ Token refreshed");

      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include"
      });

    } else {

      console.warn("❌ Refresh failed");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

    }
  }

  return response;
};