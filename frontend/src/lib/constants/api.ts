// API endpoints and configuration constants

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Health check
  HEALTH: '/health',

  // Task endpoints
  TASKS: '/api/todos/',
  TASK_BY_ID: (id: string) => `/api/todos/${id}`,
  TOGGLE_TASK: (id: string) => `/api/todos/${id}/toggle`,
} as const;

export const API_TIMEOUT = 30000; // 30 seconds

export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504],
} as const;
