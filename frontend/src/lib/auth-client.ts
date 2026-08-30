// Better Auth client configuration
"use client";

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    jwtClient({
      jwks: {
        jwksPath: "/.well-known/jwks.json",
      },
    }),
  ],
});

// Helper stubs for backward-compatibility without localStorage dependency
export function getJwtToken(): string | null {
  return null;
}

export function clearJwtToken(): void {
  // Cookies are cleared automatically by Better Auth signOut()
}

export async function fetchAndStoreJwt(): Promise<string | null> {
  try {
    const { data, error } = await authClient.token();
    if (error || !data?.token) {
      return null;
    }
    return data.token;
  } catch {
    return null;
  }
}

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
