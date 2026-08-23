// Test setup and configuration
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream, WritableStream } from 'stream/web';

// Polyfill web globals on both global and globalThis before MSW is required
const globalsMap = {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  TransformStream,
  WritableStream,
  fetch: globalThis.fetch,
  Response: globalThis.Response,
  Request: globalThis.Request,
  Headers: globalThis.Headers,
  FormData: globalThis.FormData,
};

for (const [key, val] of Object.entries(globalsMap)) {
  if (val !== undefined) {
    Object.defineProperty(global, key, { value: val, writable: true, configurable: true });
    Object.defineProperty(globalThis, key, { value: val, writable: true, configurable: true });
  }
}

// Dynamically require server after globals are configured
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockModule = require('./mocks/server');
  server = mockModule.server;
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('MSW server initialization warning:', e);
}

// Establish API mocking before all tests
beforeAll(() => {
  server?.listen?.({
    onUnhandledRequest: 'warn',
  });
});

// Reset any request handlers that we may add during the tests
afterEach(() => {
  server?.resetHandlers?.();
});

// Clean up after the tests are finished
afterAll(() => {
  server?.close?.();
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Better Auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: jest.fn(() =>
      Promise.resolve({
        user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
        accessToken: 'mock-access-token',
      })
    ),
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
  },
  getJwtToken: jest.fn(() => 'mock-jwt-token'),
  setJwtToken: jest.fn(),
  clearJwtToken: jest.fn(),
}));
