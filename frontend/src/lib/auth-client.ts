// Better Auth client configuration
"use client";

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

// Token storage key
const JWT_TOKEN_KEY = "better_auth_jwt";

export const authClient = createAuthClient({

  plugins: [
    jwtClient({
      jwks: {
        jwksPath: "/.well-known/jwks.json",
      },
    }),
  ],
  fetchOptions: {
    onSuccess: (ctx) => {
      // Capture JWT from response headers (set on getSession calls)
      const jwtToken = ctx.response.headers.get("set-auth-jwt");
      if (jwtToken && typeof window !== "undefined") {
        localStorage.setItem(JWT_TOKEN_KEY, jwtToken);
      }
    },
  },
});

// Helper to get JWT for API calls
export function getJwtToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(JWT_TOKEN_KEY);
}

// Helper to clear JWT on sign-out
export function clearJwtToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(JWT_TOKEN_KEY);
  }
}

// Fetch JWT token explicitly (call after sign-in)
export async function fetchAndStoreJwt(): Promise<string | null> {
  try {
    const { data, error } = await authClient.token();
    if (error || !data?.token) {
      return null;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(JWT_TOKEN_KEY, data.token);
    }
    return data.token;
  } catch {
    return null;
  }
}

export const { signIn, signUp, signOut, useSession } = authClient;
