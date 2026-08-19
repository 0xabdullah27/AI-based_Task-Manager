# Troubleshooting Guide

Complete catalog of errors encountered during Better Auth integration and their solutions.

---

## Error 1: PostgreSQL Connection Configuration

**Error**: `psycopg2.ProgrammingError: invalid dsn: invalid connection option "check_same_thread"`

**Cause**: SQLite-specific `connect_args` applied to PostgreSQL

**Solution**:
```python
# Conditional connect_args based on database type
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
)
```

**Prevention**: Always check database type before applying connection options.

---

## Error 2: Missing Database Driver Package

**Error**: `Module not found: Can't resolve '@neondatabase/serverless'`

**Cause**: Database-specific package not installed

**Solution by Database**:

| Database | Install Command |
|----------|-----------------|
| Neon | `npm install @neondatabase/serverless` |
| Supabase | `npm install @supabase/supabase-js` |
| Turso | `npm install @libsql/client` |
| PostgreSQL | `npm install pg` |
| MySQL | `npm install mysql2` |

**Prevention**: Check package.json before generating imports. This skill automatically detects and installs.

---

## Error 3: Better Auth CLI Can't Find DATABASE_URL

**Error**: `No database host or connection string was set` (during migration)

**Cause**: Better Auth CLI reads `.env`, NOT `.env.local`

**Solution**:
```bash
# Temporary: Copy .env.local to .env
cp frontend/.env.local frontend/.env

# Run migration
npx @better-auth/cli@latest migrate

# Optional: Delete .env after migration
rm frontend/.env
```

**Why**: CLI tools typically only read `.env`, while Next.js reads `.env.local` automatically.

**Prevention**: Create both files or copy before migration.

---

## Error 4: Better Auth Tables Missing

**Error**: `sqlalchemy.exc.ProgrammingError: relation "account" does not exist`

**Cause**: Better Auth migration not run

**Solution**:
```bash
cd frontend
npx @better-auth/cli@latest migrate
```

**Verify Tables Created**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('user', 'session', 'account', 'verification');
```

**Expected Tables**:
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth provider links
- `verification` - Email verification tokens

**Prevention**: Always run migration after configuration. This skill automates verification.

---

## Error 5: Import/Export Mismatch

**Error**: `Export api doesn't exist in target module`

**Cause**: Importing named export when default export exists

**Wrong**:
```typescript
import { api } from '@/middleware/api-interceptor';  // ❌
```

**Correct**:
```typescript
import api from '@/middleware/api-interceptor';  // ✅
```

**Prevention**: Use consistent export pattern. Prefer default exports for single-export modules.

---

## Error 6: 401 Unauthorized on API Calls (CRITICAL)

**Error**: Sign-in succeeds (200), but API calls return 401 Unauthorized

**Symptoms**:
- Sign-up works ✅
- Sign-in works ✅
- User redirected to dashboard ✅
- API calls fail with 401 ❌
- User redirected back to sign-in ❌

**Root Cause**: JWT not configured for separate backend

### 6.1 Missing JWT Plugin

**Wrong** (Monolithic config for separate backend):
```typescript
// frontend/src/lib/auth.ts
export const auth = betterAuth({
  database: pool,
  // No JWT plugin! ❌
});
```

**Correct** (JWT plugin for separate backend):
```typescript
import { jwt } from "better-auth/plugins";  // ✅

export const auth = betterAuth({
  database: pool,
  plugins: [jwt({ jwks: { jwksPath: "/.well-known/jwks.json" } })],  // ✅
});
```

### 6.2 Missing jwtClient Plugin

**Wrong**:
```typescript
// frontend/src/lib/auth-client.ts
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  // No jwtClient plugin! ❌
});
```

**Correct**:
```typescript
import { jwtClient } from "better-auth/client/plugins";  // ✅

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [jwtClient({ jwks: { jwksPath: "/.well-known/jwks.json" } })],  // ✅
});
```

### 6.3 Missing fetchAndStoreJwt() Call

**Wrong**:
```typescript
// SignInForm.tsx
await signIn.email(data);
router.push("/dashboard");  // ❌ No JWT fetched!
```

**Correct**:
```typescript
await signIn.email(data);
await fetchAndStoreJwt();   // ✅ Fetch JWT for API calls
router.push("/dashboard");
```

### 6.4 Wrong Backend Algorithm

**Wrong**:
```python
# backend/src/config.py
jwt_algorithm: str = "RS256"  # ❌ Better Auth uses EdDSA
```

**Correct**:
```python
jwt_algorithm: str = "EdDSA"  # ✅
```

### 6.5 Wrong Backend Audience

**Wrong**:
```python
jwt_audience: str = "my-app"  # ❌ Must match Better Auth URL
```

**Correct**:
```python
jwt_audience: str = "http://localhost:3000"  # ✅
```

### 6.6 Wrong JWKS URL

**Wrong**:
```python
# backend/src/auth/jwt_handler.py
jwks_url = f"{settings.better_auth_url}/.well-known/jwks.json"  # ❌ Missing /api/auth
```

**Correct**:
```python
jwks_url = f"{settings.better_auth_url}/api/auth/.well-known/jwks.json"  # ✅
```

### 6.7 Missing Backend Dependencies

**FastAPI**:
```bash
pip install 'PyJWT[crypto]' cryptography 'python-jose[cryptography]'
```

**Express**:
```bash
npm install jose jwks-rsa
```

**Prevention**: This skill detects separate backend architecture and automatically:
1. Adds JWT plugin to auth.ts
2. Adds jwtClient plugin to auth-client.ts
3. Generates backend JWT verification code
4. Configures correct algorithm (EdDSA)
5. Sets correct audience
6. Uses correct JWKS URL

---

## Error 7: Form Validation State Not Clearing

**Error**: Form fields not clearing after submission, validation errors persist

**Cause**: React Hook Form's `reset()` doesn't fully clear validation state

**Solution**: Force component remount with key prop

**Wrong**:
```typescript
// TaskForm.tsx
const handleSubmit = async (data) => {
  await onSubmit(data);
  reset();  // ❌ Doesn't always clear validation state
};
```

**Correct**:
```typescript
// Dashboard.tsx (parent)
const [formKey, setFormKey] = useState(0);

const handleCreate = async (data) => {
  await createTask(data);
  setFormKey(prev => prev + 1);  // ✅ Force remount
};

return <TaskForm key={formKey} onSubmit={handleCreate} />;
```

**Why This Works**: Changing key forces React to unmount old instance and mount new one with fresh state.

---

## Diagnostic Commands

### Check Database Connection
```bash
# PostgreSQL
psql "$DATABASE_URL" -c "SELECT 1;"

# Check tables exist
psql "$DATABASE_URL" -c "\\dt"
```

### Check Better Auth Tables
```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('user', 'session', 'account', 'verification')
ORDER BY table_name, ordinal_position;
```

### Check JWT Token Storage
```javascript
// Browser console
localStorage.getItem('better_auth_jwt')
```

### Check API Request Headers
```javascript
// Browser DevTools → Network → Select API request → Headers
// Look for: Authorization: Bearer eyJ...
```

### Test JWT Verification (Backend)
```python
# backend/test_jwt.py
from src.auth.jwt_handler import verify_jwt

token = "your-jwt-token-here"
payload = verify_jwt(token)
print(payload)
```

---

## Prevention Checklist

Use this checklist to avoid all 7 errors:

### Before Generation
- [ ] Ask architecture (monolithic vs separate backend)
- [ ] Ask database type
- [ ] Check if src/ directory exists

### During Generation
- [ ] Add JWT plugin IF backend is separate
- [ ] Add jwtClient plugin IF backend is separate
- [ ] Install database-specific package
- [ ] Generate backend verification code IF separate
- [ ] Use EdDSA algorithm (not RS256)
- [ ] Include /api/auth in JWKS URL

### After Generation
- [ ] Create both .env and .env.local
- [ ] Run Better Auth migration
- [ ] Verify tables created
- [ ] Test sign-up → fetch JWT → API call
- [ ] Verify Authorization header in requests
- [ ] Check backend returns 200 (not 401)

---

## Quick Reference: Architecture Decision

| Your Setup | JWT Plugin? | jwtClient? | Backend Code? |
|------------|-------------|------------|---------------|
| Next.js API routes only | ❌ No | ❌ No | ❌ No |
| FastAPI backend (separate) | ✅ Yes | ✅ Yes | ✅ Yes (Python) |
| Express backend (separate) | ✅ Yes | ✅ Yes | ✅ Yes (TypeScript) |

**Rule**: If backend is on different port/domain → JWT required.
