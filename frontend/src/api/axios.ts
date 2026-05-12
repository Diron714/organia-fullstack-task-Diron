import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import type { ErrorResponse } from "@/types/api.types";

function normalizeBaseUrl(url: string | undefined): string {
  if (!url) return import.meta.env.DEV ? "/api" : "";
  // If the value is missing the scheme (e.g. "example.com/api"), prepend https://
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
    return "https://" + url;
  }
  return url;
}

const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

const axiosInstance = axios.create({
  baseURL: BASE_URL,
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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: Error | null, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as {
      _retry?: boolean;
      url?: string;
      headers: Record<string, string>;
    };
    const reqUrl = typeof originalRequest.url === "string" ? originalRequest.url : "";

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !reqUrl.includes("/auth/refresh") &&
      !isAuthPublicPath(reqUrl)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token as string}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const response = await axiosInstance.post("/auth/refresh");
        const newToken = response.data.accessToken as string;
        useAuthStore.getState().setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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

export default axiosInstance;
