# Better Auth Integration v2

**Architecture-aware Better Auth integration skill for Next.js + separate backend support**

Version: 2.0.0
Status: Production Ready
Last Updated: January 2026

---

## Overview

This skill generates complete Better Auth authentication setups with **architecture awareness**. It detects whether you're building a monolithic Next.js app or using a separate backend (microservices), and configures authentication accordingly.

### Key Features

- ✅ Interactive architecture detection (monolithic vs separate backend)
- ✅ JWT plugin auto-configuration for separate backends
- ✅ Backend code generation (FastAPI, Express)
- ✅ Database-specific dependency management
- ✅ Migration automation with verification
- ✅ Comprehensive documentation generation

### Critical Fix from v1

**v1 Problem:** Generated cookie-based auth that failed for separate backends (401 errors)
**v2 Solution:** Detects architecture and configures JWT tokens when backend is separate

---

## Skill Structure

```
better-auth-integration-v2/
├── SKILL.md                    # Main skill workflow (8 phases)
├── README.md                   # This file
├── references/                 # Domain expertise
│   ├── better-auth-patterns.md     # JWT plugin config, API reference
│   ├── fastapi-integration.md      # PyJWKClient patterns, middleware
│   ├── database-integrations.md    # Dependency matrix, DB configs
│   ├── migration-guide.md          # CLI behavior, .env details
│   └── troubleshooting.md          # 7 common errors + solutions
├── assets/templates/           # Complete file templates
│   ├── auth-monolithic.ts.template
│   ├── auth-separate.ts.template
│   ├── auth-client-monolithic.ts.template
│   ├── auth-client-separate.ts.template
│   ├── api-interceptor.ts.template
│   ├── jwt_handler.py.template
│   ├── middleware_auth.py.template
│   └── route.ts.template
└── scripts/                    # Automation scripts
    └── verify-migration.py         # Automated migration verification
```

---

## Usage

### Invocation

```bash
# From Claude Code CLI
Use the better-auth-integration-v2 skill

# Or explicitly
/skill better-auth-integration-v2
```

### Workflow

The skill follows an 8-phase workflow:

1. **Architecture Detection** - Interactive questions (monolithic vs separate backend)
2. **Decision Summary** - Confirm configuration before proceeding
3. **Dependency Management** - Install database drivers and auth packages
4. **File Generation** - Create auth files (with/without JWT based on architecture)
5. **Environment Setup** - Generate .env files with correct configuration
6. **Migration** - Run Better Auth CLI to create database tables
7. **Documentation** - Generate setup guides and troubleshooting docs
8. **Verification** - Automated checks and user checklist

---

## When to Use This Skill

**Use when:**
- Setting up authentication in Next.js 13+ (App Router)
- Using Better Auth for the first time
- **Integrating Next.js frontend with separate backend** (FastAPI, Express, etc.)
- Migrating from NextAuth to Better Auth

**Do NOT use for:**
- NextAuth (use different skill)
- Clerk, Auth0, or other auth services
- Next.js Pages Router (adapt or use v1)

---

## Architecture Support

### Monolithic (Next.js API Routes Only)

**Generated Configuration:**
- auth.ts: NO JWT plugin (uses cookies)
- auth-client.ts: NO jwtClient plugin
- Authentication: HTTP-only cookies (automatic)

**Use Case:** Single Next.js application handling both frontend and backend

### Separate Backend (Microservices)

**Generated Configuration:**
- auth.ts: WITH JWT plugin (generates tokens)
- auth-client.ts: WITH jwtClient plugin + token management
- api-interceptor.ts: Axios interceptor with Bearer token
- Backend files: jwt_handler.py, middleware/auth.py (FastAPI)
- Authentication: JWT tokens for cross-service communication

**Use Case:** Next.js frontend + separate backend service (FastAPI, Express, etc.)

---

## Database Support

| Database | Frontend Package | Backend Package |
|----------|------------------|-----------------|
| Neon Serverless | @neondatabase/serverless | N/A |
| Supabase | @supabase/supabase-js | N/A |
| Turso (LibSQL) | @libsql/client | libsql-client (Python) |
| PostgreSQL | pg | psycopg2 or asyncpg |
| MySQL | mysql2 | pymysql or aiomysql |
| SQLite | N/A (built-in) | N/A (dev only) |

The skill automatically detects which database driver to install based on user selection.

---

## Reference Files

### better-auth-patterns.md
- JWT plugin configuration (basic + advanced)
- JWT client plugin configuration
- Better Auth core configuration
- Auth client patterns
- Token lifecycle management
- Security best practices
- Common patterns by architecture

### fastapi-integration.md
- Complete jwt_handler.py implementation
- FastAPI middleware patterns
- Protected endpoint examples
- JWT verification with PyJWKClient
- JWKS URL configuration
- Testing patterns

### database-integrations.md
- Dependency matrix for all databases
- Frontend configurations (connection pools)
- Backend SQLModel engine configuration
- Conditional connect_args (SQLite vs PostgreSQL)
- Connection string formats
- Database-specific best practices

### migration-guide.md
- Better Auth CLI behavior
- .env vs .env.local explanation
- Step-by-step migration process
- Table schema reference
- Database-specific notes
- Verification scripts
- Common migration issues

### troubleshooting.md
- Complete catalog of 7 errors
- Root cause analysis
- Wrong/correct code comparisons
- Diagnostic commands
- Prevention checklist
- Architecture decision table

---

## Templates

All templates use `{{PLACEHOLDER}}` syntax for variable substitution:

- `{{FILE_PATH}}` - Generated file path
- `{{DATABASE_IMPORT}}` - Database driver import (Pool, createClient, etc.)
- `{{DATABASE_PACKAGE}}` - Database package name
- `{{DATABASE_CLIENT}}` - Client variable name
- `{{DATABASE_CONNECTION}}` - Connection instantiation
- `{{BETTER_AUTH_URL}}` - Frontend URL
- `{{BACKEND_URL}}` - Backend URL (for separate backend)

---

## Scripts

### verify-migration.py

Automated migration verification script.

**Purpose:**
- Verify all 4 tables exist (user, session, account, verification)
- Check critical columns present
- Verify foreign key constraints
- Verify indexes created
- Display helpful next steps

**Usage:**
```bash
python scripts/verify-migration.py
```

**Requirements:**
- Python 3.11+
- SQLAlchemy
- python-dotenv (optional)
- DATABASE_URL environment variable

---

## Error Prevention

The skill prevents 7 common errors identified during implementation:

1. **PostgreSQL Connection Config** - Conditional connect_args
2. **Missing Database Driver** - Automatic package detection
3. **Better Auth CLI Environment** - .env vs .env.local explanation
4. **Missing Database Tables** - Migration automation
5. **Import/Export Mismatch** - Consistent export patterns
6. **JWT Authentication Failure** - Architecture-aware JWT configuration ⚠️ CRITICAL
7. **Form Validation State** - React key remount pattern

---

## Version History

### v2.0.0 (January 2026)
- **Breaking Change:** Architecture detection required (not automatic)
- **Added:** JWT plugin configuration for separate backends
- **Added:** Backend integration (FastAPI, Express)
- **Added:** Migration verification automation
- **Fixed:** 401 errors for separate backends

### v1.0.0 (Legacy)
- Basic Better Auth integration
- Cookie-based authentication only
- No backend integration
- **Issue:** Failed for separate backends (401 errors)

---

## Testing

### Manual Testing Checklist

- [ ] Architecture detection questions work correctly
- [ ] Correct files generated based on architecture
- [ ] Dependencies installed successfully
- [ ] Migration creates all 4 tables
- [ ] Sign-up flow works
- [ ] JWT token stored (if separate backend)
- [ ] API calls include Authorization header (if separate backend)
- [ ] Backend returns 200 (not 401)

### Automated Testing

```bash
# Verify migration
python scripts/verify-migration.py

# Test JWT verification (backend)
pytest backend/tests/test_auth.py
```

---

## Known Limitations

1. **Next.js Pages Router:** Not officially supported (use App Router)
2. **SQLite Production:** Not recommended for production (use PostgreSQL/MySQL)
3. **Custom Auth Providers:** Requires manual configuration
4. **Token Refresh:** Not implemented (manual implementation required)

---

## Support

**Better Auth Documentation:**
- https://better-auth.com/docs

**Skill Issues:**
- See TROUBLESHOOTING.md for common issues
- Check IMPLEMENTATION_JOURNAL.md for detailed error solutions

**Related Files:**
- `.specify/skills/better-auth-integration-v2.md` - Original specification
- `SKILL_GAP_ANALYSIS.md` - Analysis of v1 issues

---

## License

This skill is part of the project and follows the project's license.

---

## Contributors

Created by: Claude Code (Anthropic)
Based on: Real-world implementation errors and solutions
Tested with: Next.js 16.x, Better Auth 1.4.x, FastAPI 0.109.x

---

**END OF README**
