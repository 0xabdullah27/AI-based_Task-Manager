# Next.js 16 + Better Auth Integration Patterns

## Overview

Better Auth integration with Next.js 16 App Router for authentication.

## Project Setup

### 1. Install Better Auth

```bash
npm install better-auth
```

### 2. Create Auth Instance

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: {
    // Your database configuration
    // For Neon PostgreSQL:
    // type: "postgres",
    // url: process.env.DATABASE_URL,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set true in production
  },
  plugins: [
    jwt(), // For external API authentication
    nextCookies(), // For server action cookie handling (must be last)
  ],
});
```

### 3. Create API Route Handler

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

### 4. Create Auth Client

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [jwtClient()],
});
```

## Authentication Patterns

### Sign Up

```typescript
// Client-side
"use client";
import { authClient } from "@/lib/auth-client";

const handleSignUp = async (email: string, password: string, name: string) => {
  const { data, error } = await authClient.signUp.email({
    email,
    password,
    name,
  });

  if (error) {
    console.error("Sign up failed:", error.message);
    return;
  }

  // User is signed in automatically after sign up
  console.log("Signed up:", data.user);
};
```

### Sign In

```typescript
// Client-side
"use client";
import { authClient } from "@/lib/auth-client";

const handleSignIn = async (email: string, password: string) => {
  const { data, error } = await authClient.signIn.email({
    email,
    password,
  });

  if (error) {
    console.error("Sign in failed:", error.message);
    return;
  }

  console.log("Signed in:", data.user);
};
```

### Sign Out

```typescript
// Client-side
"use client";
import { authClient } from "@/lib/auth-client";

const handleSignOut = async () => {
  const { error } = await authClient.signOut();

  if (error) {
    console.error("Sign out failed:", error.message);
  }
};
```

### Get Session (Client-side)

```typescript
// Client-side with hook
"use client";
import { authClient } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;

  return <div>Welcome, {session.user.name}</div>;
}
```

### Get Session (Server-side)

```typescript
// Server Component or Server Action
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

## Protected Routes

### Page-Level Protection (Recommended)

```typescript
// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <h1>Welcome {session.user.name}</h1>;
}
```

### Proxy (Next.js 16+)

```typescript
// proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // Optimistic check - validate in page/route
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

## JWT Token for External API

### Get JWT Token

```typescript
// Client-side
"use client";
import { authClient } from "@/lib/auth-client";

const fetchFromExternalAPI = async () => {
  // Get JWT token from Better Auth
  const { data, error } = await authClient.token();

  if (error || !data?.token) {
    throw new Error("Failed to get token");
  }

  // Use token to call external API (e.g., FastAPI backend)
  const response = await fetch("http://localhost:8000/api/todos", {
    headers: {
      Authorization: `Bearer ${data.token}`,
      "Content-Type": "application/json",
    },
  });

  return response.json();
};
```

### Token from Session Header

```typescript
// Alternative: Get JWT from session response
const getTokenFromSession = async () => {
  let token: string | null = null;

  await authClient.getSession({
    fetchOptions: {
      onSuccess: (ctx) => {
        token = ctx.response.headers.get("set-auth-jwt");
      },
    },
  });

  return token;
};
```

## Server Actions with Auth

```typescript
// app/actions.ts
"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createTodoAction(title: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Create todo for authenticated user
  // ...
}
```

## Gotchas

1. **Cookie Handling in Server Actions**: Use `nextCookies()` plugin as the LAST plugin in the array.

2. **RSC Cookie Cache**: RSCs cannot set cookies. Cookie cache refreshes on client interaction.

3. **Proxy vs Page Auth**: Proxy is for optimistic redirects only. Always validate in page/route.

4. **JWT Plugin vs Bearer Plugin**:
   - JWT Plugin: Generate tokens for external services
   - Bearer Plugin: Accept tokens instead of cookies for your own API

5. **Session Hook Refetching**: `useSession` refetches on window focus by default.

## Password Requirements

Default Better Auth password requirements can be customized:

```typescript
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      minLength: 8,  // Minimum length
      // Custom validation
      validate: (password) => {
        if (!/\d/.test(password)) {
          return "Password must contain at least one number";
        }
        return true;
      },
    },
  },
});
```
