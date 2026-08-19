---
name: better-auth-integration-v2
description: |
  Architecture-aware Better Auth integration for Next.js with optional separate backend support.
  This skill should be used when setting up authentication in Next.js 13+ (App Router) with Better Auth,
  especially when integrating with a separate backend (FastAPI, Express). Automatically detects architecture
  (monolithic vs microservices), configures JWT tokens for separate backends, generates backend verification
  code, manages database-specific dependencies, and runs migrations with verification.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Better Auth Integration v2

**Critical Fix**: v1 generated cookie-based auth that failed for separate backends (401 errors).
v2 detects architecture and configures JWT when backend is separate.

## Before Implementation

Gather context to ensure successful implementation:

| Source | Gather |
|--------|--------|
| **Codebase** | Project structure, existing auth, database setup |
| **Conversation** | User's architecture, tech stack, requirements |
| **Skill References** | Better Auth patterns, FastAPI integration, database configs |
| **User Guidelines** | Project conventions, security requirements |

**Note**: Domain expertise (Better Auth API, JWT/JWKS, FastAPI patterns) is embedded in this skill's `references/`.
Only ask user for THEIR specific requirements (architecture, database choice, backend framework).

---

## Workflow Overview

```
Architecture Questions → Dependency Check → File Generation → Migration → Verification
```

---

## Phase 1: Architecture Detection (CRITICAL)

Ask these questions sequentially (not all at once):

### Q1: Backend Architecture

```
🏗️  Is your backend separate from your Next.js frontend?

A) Monolithic - Backend is Next.js API routes (same project)
B) Separate Backend - Different service (FastAPI, Express, etc.)

💡 Tip: Running backend on different port/domain → Separate
```

**If B (Separate Backend)**, ask:

### Q2: Backend Framework

```
🔧 What framework is your backend?

A) FastAPI (Python)
B) Express (Node.js/TypeScript)
C) NestJS (Node.js/TypeScript)
D) Other: _______
```

### Q3: Backend URL

```
🌐 Backend URL for development: _____ (e.g., http://localhost:8000)
```

### Q4: Database Type

```
💾 Which database?

A) Neon Serverless (PostgreSQL)
B) Supabase (PostgreSQL)
C) Turso (LibSQL)
D) PostgreSQL (vanilla)
E) MySQL
F) SQLite (dev only)
```

### Q5: Project Structure

```
📁 Using src/ directory? (yes/no)
```

---

## Phase 2: Decision Summary

Present configuration for confirmation:

```markdown
## Configuration Summary

✅ Architecture: [Monolithic / Separate Backend (FastAPI)]
✅ Backend URL: [http://localhost:8000]
✅ Database: [Neon Serverless PostgreSQL]
✅ Project Structure: [Using src/]

### Files to Generate:

**Frontend:**
- src/lib/auth.ts [WITH / WITHOUT JWT plugin]
- src/lib/auth-client.ts [WITH / WITHOUT jwtClient plugin]
- src/app/api/auth/[...all]/route.ts
[IF SEPARATE] src/middleware/api-interceptor.ts

**Backend (if separate):**
[IF FastAPI] backend/src/auth/jwt_handler.py
[IF FastAPI] backend/src/middleware/auth.py
[IF Express] backend/src/middleware/jwt.ts

**Environment:**
- .env.local (Next.js)
- .env (Better Auth CLI)
[IF BACKEND] backend/.env

**Dependencies:**
- [@neondatabase/serverless / other database driver]
- better-auth
[IF BACKEND+FASTAPI] PyJWT[crypto], cryptography

Proceed? (yes/no)
```

---

## Phase 3: Dependency Management

### 3.1 Check & Install Frontend Dependencies

Based on database choice, determine package:

| Database | Package |
|----------|---------|
| Neon | `@neondatabase/serverless` |
| Supabase | `@supabase/supabase-js` |
| Turso | `@libsql/client` |
| PostgreSQL | `pg` |
| MySQL | `mysql2` |

**Action**:
```bash
cd frontend
npm install <database-package> better-auth
```

### 3.2 Install Backend Dependencies (if separate)

**FastAPI**:
```bash
cd backend
pip install 'PyJWT[crypto]' cryptography 'python-jose[cryptography]'
```

**Express**:
```bash
cd backend
npm install jose jwks-rsa
```

See `references/database-integrations.md` for complete dependency matrix.

---

## Phase 4: File Generation

### 4.1 Frontend Auth Configuration

**Critical Decision**: JWT plugin required ONLY if backend is separate.

**For Separate Backend:**
```typescript
// frontend/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";  // ← CRITICAL
import { Pool } from "@neondatabase/serverless";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: { enabled: true },
  plugins: [
    jwt({  // ← REQUIRED for separate backend
      jwks: { jwksPath: "/.well-known/jwks.json" },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_API_URL,  // Backend URL
  ],
});
```

**For Monolithic:**
```typescript
// NO jwt plugin needed - cookies work
export const auth = betterAuth({
  database: pool,
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  // No plugins needed
});
```

See `assets/templates/` for complete file templates.

### 4.2 Frontend Auth Client

**For Separate Backend** - add jwtClient plugin:

```typescript
// frontend/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";  // ← CRITICAL

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [jwtClient({ jwks: { jwksPath: "/.well-known/jwks.json" } })],
  fetchOptions: {
    onSuccess: (ctx) => {
      const jwtToken = ctx.response.headers.get("set-auth-jwt");
      if (jwtToken) localStorage.setItem("better_auth_jwt", jwtToken);
    },
  },
});

// JWT helpers
export function getJwtToken() {
  return localStorage.getItem("better_auth_jwt");
}

export async function fetchAndStoreJwt() {
  const { data } = await authClient.token();
  if (data?.token) {
    localStorage.setItem("better_auth_jwt", data.token);
    return data.token;
  }
  return null;
}
```

### 4.3 API Interceptor (Separate Backend Only)

```typescript
// frontend/src/middleware/api-interceptor.ts
import axios from 'axios';
import { getJwtToken, clearJwtToken } from '@/lib/auth-client';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add JWT to all requests
apiClient.interceptors.request.use((config) => {
  const token = getJwtToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Clear token on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearJwtToken();
      window.location.href = `/sign-in?returnUrl=${window.location.pathname}`;
    }
    return Promise.reject(error);
  }
);
```

### 4.4 Backend JWT Verification (FastAPI)

**Critical**: JWKS URL must include `/api/auth` prefix.

```python
# backend/src/auth/jwt_handler.py
import jwt
from jwt import PyJWKClient
from src.config import settings

# JWKS endpoint - MUST include /api/auth prefix
jwks_url = f"{settings.better_auth_url}/api/auth/.well-known/jwks.json"
jwks_client = PyJWKClient(jwks_url)

def verify_jwt(token: str):
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["EdDSA"],  # Better Auth default
        audience=settings.better_auth_url,
    )
    return payload

def get_user_id(token: str) -> str:
    payload = verify_jwt(token)
    return payload["sub"]
```

```python
# backend/src/middleware/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from src.auth.jwt_handler import get_user_id

security = HTTPBearer()

async def get_current_user_id(credentials = Depends(security)) -> str:
    try:
        return get_user_id(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
```

```python
# backend/src/config.py (additions)
class Settings(BaseSettings):
    better_auth_url: str = "http://localhost:3000"
    jwt_algorithm: str = "EdDSA"  # Better Auth default - DO NOT CHANGE
    jwt_audience: str = "http://localhost:3000"
```

See `references/fastapi-integration.md` for complete patterns.

### 4.5 Sign-In Form (CRITICAL for Separate Backend)

**Must call `fetchAndStoreJwt()` after sign-in**:

```typescript
// frontend/src/components/auth/SignInForm.tsx
import { signIn, fetchAndStoreJwt } from "@/lib/auth-client";

const onSubmit = async (data) => {
  await signIn.email(data);
  await fetchAndStoreJwt();  // ← CRITICAL: Without this, API calls fail with 401
  router.push("/dashboard");
};
```

---

## Phase 5: Environment Setup

### 5.1 Create Environment Files

**Frontend `.env.local`** (Next.js reads this):
```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="<random-string>"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

**Frontend `.env`** (Better Auth CLI reads this):
```env
# Temporary - only for migration
DATABASE_URL="postgresql://..."
```

**Backend `.env`** (if separate):
```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_URL="http://localhost:3000"
JWT_ALGORITHM="EdDSA"
JWT_AUDIENCE="http://localhost:3000"
```

See `references/migration-guide.md` for CLI behavior details.

---

## Phase 6: Migration

### 6.1 Setup for Migration

Explain: Better Auth CLI reads `.env`, NOT `.env.local`.

**Action**:
```bash
cd frontend
cp .env.local .env  # Temporary
```

### 6.2 Run Migration

Ask user: "Run Better Auth migration to create tables (user, session, account, verification)? (yes/no)"

If yes:
```bash
npx @better-auth/cli@latest migrate
```

Expected output:
```
✓ Connecting to database...
✓ Running migrations...
✓ Created table: user
✓ Created table: session
✓ Created table: account
✓ Created table: verification
```

### 6.3 Verify Migration

Check tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user', 'session', 'account', 'verification');
```

Report results:
```
✅ Migration Verification
- ✅ user
- ✅ session
- ✅ account
- ✅ verification
```

Use `scripts/verify-migration.py` for automated verification.

---

## Phase 7: Documentation Generation

Generate:

1. **SETUP_GUIDE.md** - Step-by-step installation, architecture diagram
2. **AUTHENTICATION_FLOW.md** - Sign-up/sign-in/API flows
3. **TROUBLESHOOTING.md** - 7 common errors + solutions
4. **TESTING_GUIDE.md** - Manual + automated test patterns

Templates in `references/troubleshooting.md`.

---

## Phase 8: Final Verification

### Automated Checks

```markdown
✅ Files Created:
  - [✅ / ❌] frontend/src/lib/auth.ts (with JWT if separate backend)
  - [✅ / ❌] frontend/src/lib/auth-client.ts (with jwtClient if separate)
  - [✅ / ❌] frontend/src/app/api/auth/[...all]/route.ts
  [IF SEPARATE] - [✅ / ❌] frontend/src/middleware/api-interceptor.ts
  [IF FASTAPI] - [✅ / ❌] backend/src/auth/jwt_handler.py
  [IF FASTAPI] - [✅ / ❌] backend/src/middleware/auth.py

✅ Dependencies:
  - [✅ / ❌] Database driver installed
  - [✅ / ❌] better-auth installed
  [IF FASTAPI] - [✅ / ❌] PyJWT installed

✅ Migration:
  - [✅ / ❌] Tables created and verified

✅ Configuration:
  [IF SEPARATE] - [✅ / ❌] JWT plugin configured
  [IF SEPARATE] - [✅ / ❌] jwtClient plugin configured
  [IF SEPARATE] - [✅ / ❌] Backend verification code generated
```

### User Checklist

```markdown
## Next Steps

1. Start servers:
   - Backend: `uvicorn src.main:app --reload --port 8000`
   - Frontend: `npm run dev`

2. Test authentication:
   - [ ] Navigate to /sign-up
   - [ ] Create account
   - [ ] Check localStorage for "better_auth_jwt"
   - [ ] Make API call
   - [ ] Verify 200 response (not 401)

3. Review documentation:
   - [ ] SETUP_GUIDE.md
   - [ ] TROUBLESHOOTING.md
```

---

## Common Mistakes to Avoid

### 1. Forgetting fetchAndStoreJwt()
```typescript
// ❌ WRONG
await signIn.email(data);
router.push("/dashboard");

// ✅ CORRECT
await signIn.email(data);
await fetchAndStoreJwt();  // Must call this!
router.push("/dashboard");
```

### 2. Wrong JWKS URL
```python
# ❌ WRONG
jwks_url = f"{url}/.well-known/jwks.json"

# ✅ CORRECT - includes /api/auth
jwks_url = f"{url}/api/auth/.well-known/jwks.json"
```

### 3. Wrong Algorithm
```python
# ❌ WRONG
jwt_algorithm = "RS256"

# ✅ CORRECT - Better Auth uses EdDSA
jwt_algorithm = "EdDSA"
```

### 4. Audience Mismatch
```python
# ❌ WRONG
jwt_audience = "my-app"

# ✅ CORRECT - must match Better Auth URL
jwt_audience = "http://localhost:3000"
```

See `references/troubleshooting.md` for complete error catalog.

---

## Reference Files

| File | Purpose |
|------|---------|
| `references/better-auth-patterns.md` | JWT plugin config, API reference |
| `references/fastapi-integration.md` | PyJWKClient patterns, middleware |
| `references/database-integrations.md` | Dependency matrix, connection configs |
| `references/migration-guide.md` | CLI behavior, verification |
| `references/troubleshooting.md` | 7 common errors + solutions |
| `assets/templates/` | Complete file templates |
| `scripts/verify-migration.py` | Automated migration verification |

---

## Version Info

**Version**: 2.0.0
**Breaking Changes from v1**:
- Architecture detection required (not automatic)
- JWT configuration different (plugin-based)
- Backend integration added
- Migration verification required

**Tested With**:
- Next.js 16.x, Better Auth 1.4.x, FastAPI 0.109.x
- Python 3.11+, Node.js 18+
