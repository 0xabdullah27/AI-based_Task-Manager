// Better Auth server configuration
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simplified for development
  },
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
  plugins: [
    jwt({
      jwks: {
        jwksPath: "/.well-known/jwks.json",
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
