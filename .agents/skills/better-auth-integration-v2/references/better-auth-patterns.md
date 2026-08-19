# Better Auth Patterns

Complete reference for Better Auth JWT plugin configuration and API patterns.

---

## JWT Plugin Configuration

### Basic JWT Plugin

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  database: pool,
  plugins: [
    jwt({
      jwks: {
        // Path where JWKS endpoint will be served
        jwksPath: "/.well-known/jwks.json",
      },
    }),
  ],
});
```

### Advanced JWT Plugin Options

```typescript
import { jwt } from "better-auth/plugins";

jwt({
  jwks: {
    // JWKS endpoint path (default: "/.well-known/jwks.json")
    jwksPath: "/.well-known/jwks.json",

    // Key rotation period (in seconds)
    // Default: 86400 (24 hours)
    rotationPeriod: 86400,

    // Number of keys to keep in JWKS
    // Default: 2 (current + previous for rotation)
    keySize: 2,
  },

  // JWT token expiration time (in seconds)
  // Default: 3600 (1 hour)
  expiresIn: 60 * 60 * 24, // 24 hours

  // JWT issuer (optional)
  // Default: baseURL from Better Auth config
  issuer: "http://localhost:3000",

  // JWT audience (optional)
  // Default: baseURL from Better Auth config
  audience: "http://localhost:3000",

  // Custom JWT claims (optional)
  claims: (user, session) => ({
    // Add custom claims here
    role: user.role,
    permissions: user.permissions,
  }),

  // Algorithm (optional, default: EdDSA)
  // DO NOT change unless you have specific requirements
  algorithm: "EdDSA",
})
```

---

## JWT Client Plugin Configuration

### Basic JWT Client

```typescript
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    jwtClient({
      jwks: {
        jwksPath: "/.well-known/jwks.json",
      },
    }),
  ],
});
```

### Advanced JWT Client Options

```typescript
import { jwtClient } from "better-auth/client/plugins";

jwtClient({
  jwks: {
    // JWKS endpoint path (must match server)
    jwksPath: "/.well-known/jwks.json",

    // Cache JWKS in memory (default: true)
    cache: true,

    // JWKS cache TTL in seconds (default: 600 = 10 minutes)
    cacheTTL: 600,
  },

  // Automatically refresh token before expiry (default: false)
  autoRefresh: true,

  // Refresh threshold in seconds (default: 300 = 5 minutes)
  // Token will refresh when < 5 minutes remaining
  refreshThreshold: 300,

  // Storage for JWT token (default: localStorage)
  storage: {
    get: () => localStorage.getItem("better_auth_jwt"),
    set: (token) => localStorage.setItem("better_auth_jwt", token),
    remove: () => localStorage.removeItem("better_auth_jwt"),
  },
})
```

---

## Better Auth Core Configuration

### Complete Configuration Example

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  // ========================================
  // Database Configuration
  // ========================================

  database: pool,

  // Alternative: Direct database config
  // database: {
  //   type: "postgres",  // or "mysql", "sqlite"
  //   url: process.env.DATABASE_URL,
  // },

  // ========================================
  // Authentication Methods
  // ========================================

  emailAndPassword: {
    enabled: true,

    // Require email verification before allowing sign-in
    requireEmailVerification: false,

    // Password requirements
    minPasswordLength: 8,
    maxPasswordLength: 128,

    // Auto sign-in after sign-up
    autoSignIn: true,
  },

  // ========================================
  // Session Configuration
  // ========================================

  session: {
    // Session expiration time (in seconds)
    // Default: 604800 (7 days)
    expiresIn: 60 * 60 * 24 * 7, // 7 days

    // Update session activity on every request
    updateAge: 60 * 60 * 24, // 1 day

    // Cookie configuration
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // ========================================
  // Security Configuration
  // ========================================

  // Secret for signing tokens and sessions
  // MUST be a strong random string in production
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",

  // Base URL (used for OAuth redirects, CORS, etc.)
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // Trusted origins for CORS
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  ],

  // Advanced security options
  advanced: {
    // Use secure cookies (HTTPS only)
    useSecureCookies: process.env.NODE_ENV === "production",

    // Cookie SameSite policy
    cookieSameSite: "lax", // or "strict", "none"

    // CSRF protection
    csrfProtection: {
      enabled: true,
      ignorePaths: ["/api/auth/callback/*"],
    },
  },

  // ========================================
  // Plugins
  // ========================================

  plugins: [
    // JWT plugin (required for separate backend)
    jwt({
      jwks: { jwksPath: "/.well-known/jwks.json" },
      expiresIn: 60 * 60 * 24, // 24 hours
    }),

    // Other plugins can be added here:
    // - twoFactor() - Two-factor authentication
    // - magicLink() - Passwordless email links
    // - oauth() - OAuth providers
  ],

  // ========================================
  // Email Configuration (if using verification)
  // ========================================

  // emailVerification: {
  //   sendVerificationEmail: async ({ user, url }) => {
  //     // Send email with verification link
  //     await sendEmail({
  //       to: user.email,
  //       subject: "Verify your email",
  //       html: `Click here to verify: ${url}`,
  //     });
  //   },
  //   expiresIn: 60 * 60 * 24, // 24 hours
  // },

  // ========================================
  // Hooks (optional)
  // ========================================

  // hooks: {
  //   after: {
  //     signUp: async ({ user }) => {
  //       // Custom logic after sign-up
  //       console.log("New user:", user.email);
  //     },
  //     signIn: async ({ user }) => {
  //       // Custom logic after sign-in
  //       console.log("User signed in:", user.email);
  //     },
  //   },
  // },
});

// Export types for TypeScript
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

---

## Auth Client Configuration

### Complete Client Configuration

```typescript
"use client";

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // ========================================
  // Base Configuration
  // ========================================

  // Base URL for auth API
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Base path for auth endpoints (default: "/api/auth")
  basePath: "/api/auth",

  // ========================================
  // Plugins
  // ========================================

  plugins: [
    jwtClient({
      jwks: { jwksPath: "/.well-known/jwks.json" },
      autoRefresh: true,
      refreshThreshold: 300, // 5 minutes
    }),
  ],

  // ========================================
  // Fetch Options
  // ========================================

  fetchOptions: {
    // Custom headers
    headers: {
      "Content-Type": "application/json",
    },

    // Credentials (for cookies)
    credentials: "include",

    // Request interceptor
    onRequest: async (ctx) => {
      // Add custom headers, logging, etc.
      console.log("Request:", ctx.url);
      return ctx;
    },

    // Success interceptor
    onSuccess: async (ctx) => {
      // Capture JWT from response headers
      const jwtToken = ctx.response.headers.get("set-auth-jwt");
      if (jwtToken && typeof window !== "undefined") {
        localStorage.setItem("better_auth_jwt", jwtToken);
      }
      return ctx;
    },

    // Error interceptor
    onError: async (ctx) => {
      console.error("Auth error:", ctx.error);
      return ctx;
    },
  },

  // ========================================
  // Session Configuration
  // ========================================

  session: {
    // Session polling interval (0 = disabled)
    // Checks for session changes periodically
    pollingInterval: 0,

    // Refresh session on window focus
    refreshOnWindowFocus: true,
  },
});

// Export auth methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  updateUser,
} = authClient;
```

---

## API Endpoints Reference

Better Auth automatically creates these endpoints:

### Authentication Endpoints

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/auth/sign-up/email` | POST | Email/password sign-up | `{ email, password, name? }` |
| `/api/auth/sign-in/email` | POST | Email/password sign-in | `{ email, password }` |
| `/api/auth/sign-out` | POST | Sign out | `{}` |
| `/api/auth/session` | GET | Get current session | - |
| `/api/auth/token` | GET | Get JWT token | - (requires auth) |
| `/api/auth/update-user` | POST | Update user profile | `{ name?, email? }` |
| `/api/auth/change-password` | POST | Change password | `{ currentPassword, newPassword }` |
| `/api/auth/reset-password` | POST | Request password reset | `{ email }` |
| `/api/auth/reset-password/confirm` | POST | Confirm password reset | `{ token, password }` |

### OAuth Endpoints (if configured)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/oauth/{provider}` | GET | Initiate OAuth flow |
| `/api/auth/callback/{provider}` | GET | OAuth callback |

### JWT & JWKS Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/auth/token` | GET | Get JWT token | `{ token: string }` |
| `/api/auth/.well-known/jwks.json` | GET | Get JWKS (public keys) | JWKS JSON |

---

## Client Usage Patterns

### Sign-Up Pattern

```typescript
import { signUp, fetchAndStoreJwt } from "@/lib/auth-client";

const handleSignUp = async (data: { email: string; password: string; name?: string }) => {
  try {
    // Step 1: Create account
    const { data: user, error } = await signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Step 2: Fetch JWT for API calls (if separate backend)
    await fetchAndStoreJwt();

    // Step 3: Redirect to dashboard
    router.push("/dashboard");
  } catch (error) {
    console.error("Sign-up failed:", error);
  }
};
```

### Sign-In Pattern

```typescript
import { signIn, fetchAndStoreJwt } from "@/lib/auth-client";

const handleSignIn = async (data: { email: string; password: string }) => {
  try {
    // Step 1: Sign in
    const { data: session, error } = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Step 2: Fetch JWT for API calls (CRITICAL for separate backend)
    await fetchAndStoreJwt();

    // Step 3: Redirect to dashboard
    router.push("/dashboard");
  } catch (error) {
    console.error("Sign-in failed:", error);
  }
};
```

### Sign-Out Pattern

```typescript
import { signOut, clearJwtToken } from "@/lib/auth-client";

const handleSignOut = async () => {
  try {
    // Step 1: Sign out from Better Auth
    await signOut();

    // Step 2: Clear JWT token
    clearJwtToken();

    // Step 3: Redirect to sign-in
    router.push("/sign-in");
  } catch (error) {
    console.error("Sign-out failed:", error);
  }
};
```

### Session Hook Pattern

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function ProtectedPage() {
  const { data: session, isPending, error } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error || !session) {
    // Redirect to sign-in
    router.push("/sign-in");
    return null;
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### Server Component Pattern

```typescript
// app/dashboard/page.tsx (Server Component)
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
    </div>
  );
}
```

---

## JWT Token Management

### Token Lifecycle

```typescript
// 1. After sign-in/sign-up, fetch JWT
const token = await fetchAndStoreJwt();

// 2. Token stored in localStorage
localStorage.setItem("better_auth_jwt", token);

// 3. Token attached to API requests (via interceptor)
axios.get("/api/todos", {
  headers: { Authorization: `Bearer ${token}` }
});

// 4. Backend verifies token using JWKS
// (see fastapi-integration.md for backend verification)

// 5. On expiry or 401 error, clear token
clearJwtToken();
window.location.href = "/sign-in";
```

### Token Refresh Pattern

```typescript
// Option 1: Manual refresh
export async function refreshJwtToken() {
  const newToken = await fetchAndStoreJwt();
  return newToken;
}

// Option 2: Automatic refresh with jwtClient plugin
// (see advanced JWT client configuration above)

// Option 3: Refresh on 401 error
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const newToken = await fetchAndStoreJwt();

      if (newToken) {
        // Retry original request with new token
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axios(error.config);
      }

      // Refresh failed, redirect to sign-in
      clearJwtToken();
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  }
);
```

---

## Security Best Practices

### Secret Management

```typescript
// ❌ WRONG - Hardcoded secret
const auth = betterAuth({
  secret: "my-secret-key",
});

// ✅ CORRECT - Environment variable
const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
});

// Generate strong secret:
// openssl rand -base64 32
```

### Token Storage

```typescript
// ⚠️ CURRENT - localStorage (vulnerable to XSS)
localStorage.setItem("better_auth_jwt", token);

// ✅ PRODUCTION - Consider alternatives:
// 1. Memory storage with service worker
// 2. HTTP-only cookies (requires Next.js API proxy)
// 3. Encrypted storage
```

### CORS Configuration

```typescript
// ❌ WRONG - Allow all origins
trustedOrigins: ["*"]

// ✅ CORRECT - Specific origins
trustedOrigins: [
  "http://localhost:3000",
  "https://yourapp.com",
]
```

### Algorithm Selection

```typescript
// ❌ WRONG - Using symmetric algorithms
jwt({ algorithm: "HS256" })

// ✅ CORRECT - Using asymmetric algorithms
jwt({ algorithm: "EdDSA" })  // Better Auth default

// EdDSA (Ed25519) advantages:
// - Asymmetric (public key verification)
// - Faster than RSA
// - Smaller keys
// - More secure than ECDSA
```

---

## Common Patterns by Architecture

### Monolithic (Next.js API Routes Only)

```typescript
// auth.ts - NO JWT plugin
export const auth = betterAuth({
  database: pool,
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
});

// auth-client.ts - NO jwtClient plugin
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

// Use cookies for authentication (automatic)
```

### Separate Backend (Microservices)

```typescript
// auth.ts - WITH JWT plugin
export const auth = betterAuth({
  database: pool,
  emailAndPassword: { enabled: true },
  plugins: [
    jwt({ jwks: { jwksPath: "/.well-known/jwks.json" } }),
  ],
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ],
});

// auth-client.ts - WITH jwtClient plugin
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    jwtClient({ jwks: { jwksPath: "/.well-known/jwks.json" } }),
  ],
});

// Use JWT for backend API authentication
```

---

## Troubleshooting

### JWT Plugin Not Working

**Symptoms:**
- `/api/auth/token` returns 404
- JWKS endpoint not found
- Backend can't verify tokens

**Solution:**
- Verify JWT plugin is in `plugins` array
- Check JWKS path matches in server and client
- Ensure Next.js dev server restarted after config change

### Token Not Being Stored

**Symptoms:**
- `localStorage.getItem("better_auth_jwt")` returns null
- API calls return 401

**Solution:**
- Verify `fetchAndStoreJwt()` called after sign-in
- Check `fetchOptions.onSuccess` configured correctly
- Ensure running in browser (not server component)

### JWKS Endpoint 404

**Symptoms:**
- Backend can't fetch JWKS
- Error: "JWKS endpoint not found"

**Solution:**
```python
# WRONG
jwks_url = f"{url}/.well-known/jwks.json"

# CORRECT
jwks_url = f"{url}/api/auth/.well-known/jwks.json"
```

---

## Quick Reference

### Required for Separate Backend

| Component | Required |
|-----------|----------|
| JWT plugin in auth.ts | ✅ Yes |
| jwtClient plugin in auth-client.ts | ✅ Yes |
| fetchAndStoreJwt() call after sign-in | ✅ Yes |
| API interceptor with Bearer token | ✅ Yes |
| Backend JWT verification | ✅ Yes |
| CORS configuration | ✅ Yes |

### Optional Features

| Feature | Plugin |
|---------|--------|
| Two-factor auth | `twoFactor()` |
| Magic links | `magicLink()` |
| OAuth providers | `oauth()` |
| Passkeys | `passkey()` |
| Anonymous auth | `anonymous()` |

---

## Version Compatibility

**Better Auth:**
- v1.4.x - Stable (EdDSA default)
- v1.3.x - Legacy (RS256 default)

**Next.js:**
- v13.x+ - App Router (recommended)
- v12.x - Pages Router (use adapter)

**Node.js:**
- v18+ - Recommended
- v16+ - Minimum

---

## External Resources

**Better Auth Documentation:**
- https://better-auth.com/docs
- https://better-auth.com/docs/plugins/jwt

**JWT Standards:**
- RFC 7519 (JWT): https://datatracker.ietf.org/doc/html/rfc7519
- RFC 7517 (JWKS): https://datatracker.ietf.org/doc/html/rfc7517

**EdDSA:**
- RFC 8032: https://datatracker.ietf.org/doc/html/rfc8032
- Ed25519: https://ed25519.cr.yp.to/
