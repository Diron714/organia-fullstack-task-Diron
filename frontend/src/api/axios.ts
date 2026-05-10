import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import type { ErrorResponse } from "@/types/api.types";

/** In dev, use Vite proxy (/api → localhost:8080) so cookies and ports stay consistent. */
const defaultBase =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "/api" : "http://localhost:8080/api");

const api = axios.create({
  baseURL: defaultBase,
  withCredentials: true
});

function isAuthPublicPath(url: string): boolean {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/reset-password") ||
    url.includes("/auth/verify-email")
  );
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as {
      _retry?: boolean;
      url?: string;
      headers: Record<string, string>;
    };
    const reqUrl = typeof originalRequest.url === "string" ? originalRequest.url : "";

    if (reqUrl.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isAuthPublicPath(reqUrl)) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        const refresh = await api.post("/auth/refresh");
        useAuthStore.getState().setToken(refresh.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${refresh.data.accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    if (!error.response?.data) {
      error.response = {
        ...error.response,
        data: { message: "Network error. Please try again." } satisfies ErrorResponse
      };
    }
    return Promise.reject(error);
  }
);

export default api;
