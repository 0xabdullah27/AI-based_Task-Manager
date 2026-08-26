/**
 * Error classification utility for empathetic error messages.
 */

export type ErrorType = 'network' | 'timeout' | 'auth' | 'validation' | 'server' | 'rate_limit' | 'unknown';

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  isRetryable: boolean;
}

/**
 * T423: Classify errors and provide empathetic, actionable messages.
 */
export function classifyError(error: unknown): ClassifiedError {
  // Handle network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      type: 'network',
      message: 'Connection lost. Check your internet or try again.',
      isRetryable: true,
    };
  }

  // Handle AbortError (timeout)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      type: 'timeout',
      message: 'Request timed out. Please try again.',
      isRetryable: true,
    };
  }

  // Handle response errors
  if (error instanceof Error && error.message) {
    const message = error.message.toLowerCase();

    // Rate limiting (429)
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
      return {
        type: 'rate_limit',
        message: "You're sending requests too quickly. Please wait a moment before trying again.",
        isRetryable: true,
      };
    }

    // Auth errors
    if (message.includes('401') || message.includes('unauthorized') || message.includes('session')) {
      return {
        type: 'auth',
        message: 'Session expired. Please log in again.',
        isRetryable: false,
      };
    }

    // Timeout
    if (message.includes('timeout') || message.includes('408')) {
      return {
        type: 'timeout',
        message: 'Request timed out. Please try again.',
        isRetryable: true,
      };
    }

    // Validation error
    if (message.includes('400') || message.includes('validation')) {
      return {
        type: 'validation',
        message: 'Invalid input. Please check your message and try again.',
        isRetryable: false,
      };
    }

    // Server error
    if (message.includes('500') || message.includes('server')) {
      return {
        type: 'server',
        message: 'Something went wrong on our end. Please try again.',
        isRetryable: true,
      };
    }

    // Access error
    if (message.includes('403') || message.includes('access') || message.includes('denied')) {
      return {
        type: 'validation',
        message: "You don't have permission to access this conversation.",
        isRetryable: false,
      };
    }

    // Not found
    if (message.includes('404') || message.includes('not found')) {
      return {
        type: 'validation',
        message: 'The conversation was not found. It may have been deleted.',
        isRetryable: false,
      };
    }
  }

  // Fallback
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    isRetryable: true,
  };
}
