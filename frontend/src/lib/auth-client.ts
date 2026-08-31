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

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
