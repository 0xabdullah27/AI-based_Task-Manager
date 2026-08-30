// API Interceptor for FastAPI Backend
// Handles JWT token injection, error handling, and request/response interceptors

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getJwtToken, clearJwtToken, signOut } from '@/lib/auth-client';

// Create API client
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Include cookies for cross-origin requests
});

// Request interceptor - ensures cookies are passed for authenticated requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // With credentials enabled, cookies are automatically sent by the browser
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 401 Unauthorized - clear token, sign out session, and redirect to sign-in
    if (error.response?.status === 401) {
      // Clear invalid/expired token
      clearJwtToken();

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/sign-in') && !window.location.pathname.startsWith('/sign-up')) {
        // Sign out of Better Auth session to prevent AuthLayout loop
        await signOut().catch(() => {});
        // Save current location for return after sign-in
        const returnUrl = window.location.pathname;
        window.location.href = `/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`;
      }
    }

    // Handle other errors
    if (error.response?.status === 422) {
      // Validation error - let the calling code handle it
      return Promise.reject(error);
    }

    if (error.response?.status === 500) {
      // Server error - log and show generic message
      console.error('Server error:', error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
