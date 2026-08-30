import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { signOut } from "@/lib/auth-client";

// Centralized Axios API client for FastAPI backend
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Automatically transmits httpOnly session cookies
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - handle errors and session expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // 401 Unauthorized - sign out and smoothly redirect to sign-in
    if (error.response?.status === 401) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/sign-in") &&
        !window.location.pathname.startsWith("/sign-up")
      ) {
        await signOut().catch(() => {});
        const returnUrl = window.location.pathname;
        window.location.replace(
          `/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`
        );
      }
    }

    if (error.response?.status === 500) {
      console.error("Server error:", error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
