# Database Integrations

Complete guide for database-specific configurations and dependencies.

---

## Dependency Matrix

| Database | Frontend Package | Backend Package | Pool Import |
|----------|------------------|-----------------|-------------|
| **Neon Serverless** | `@neondatabase/serverless` | N/A (uses frontend's DB) | `Pool` from `@neondatabase/serverless` |
| **Supabase** | `@supabase/supabase-js` | N/A (uses frontend's DB) | Custom setup |
| **Turso (LibSQL)** | `@libsql/client` | `libsql-client` (Python) | `createClient` |
| **PostgreSQL** | `pg` | `psycopg2` or `asyncpg` | `Pool` from `pg` |
| **MySQL** | `mysql2` | `pymysql` or `aiomysql` | `createPool` from `mysql2/promise` |
| **SQLite** | N/A (built-in) | N/A (built-in) | N/A |

---

## Frontend Configurations

### Neon Serverless

**Install**:
```bash
npm install @neondatabase/serverless
```

**auth.ts**:
```typescript
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const auth = betterAuth({
  database: pool,
  // ...
});
```

**Features**:
- ✅ Serverless-optimized (HTTP-based)
- ✅ Built-in connection pooling
- ✅ WebSocket support
- ⚠️ Requires `?sslmode=require` in connection string

---

### Supabase

**Install**:
```bash
npm install @supabase/supabase-js
```

**auth.ts**:
```typescript
import { createClient } from "@supabase/supabase-js";

// Note: Better Auth can work with Supabase's PostgreSQL directly
// Option 1: Use @neondatabase/serverless (Supabase is PostgreSQL-compatible)
import { Pool } from "@neondatabase/serverless";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Option 2: Use Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const auth = betterAuth({
  database: pool,  // Use Pool for Better Auth
  // ...
});
```

---

### Turso (LibSQL)

**Install**:
```bash
npm install @libsql/client
```

**auth.ts**:
```typescript
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const auth = betterAuth({
  database: client,
  // ...
});
```

**Environment Variables**:
```env
DATABASE_URL="libsql://your-db.turso.io"
DATABASE_AUTH_TOKEN="your-auth-token"
```

---

### PostgreSQL (Vanilla)

**Install**:
```bash
npm install pg
```

**auth.ts**:
```typescript
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // For some hosted PostgreSQL
  }
});

export const auth = betterAuth({
  database: pool,
  // ...
});
```

---

### MySQL

**Install**:
```bash
npm install mysql2
```

**auth.ts**:
```typescript
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  // ...
});
```

---

### SQLite (Development Only)

**Install**: None (built-in)

**auth.ts**:
```typescript
import Database from "better-sqlite3";

const db = new Database("./dev.db");

export const auth = betterAuth({
  database: {
    db,
    type: "sqlite",
  },
  // ...
});
```

**Note**: SQLite is NOT recommended for production. Use PostgreSQL/MySQL.

---

## Backend Database Configuration (FastAPI)

### SQLModel Engine Configuration

**Critical**: Database-specific `connect_args` must be conditional.

```python
# backend/src/db/database.py
from sqlmodel import create_engine, Session, SQLModel
from src.config import settings

# Determine connect_args based on database type
connect_args = {}
if settings.database_url.startswith("sqlite"):
    # SQLite-specific: Allow same connection across threads
    connect_args = {"check_same_thread": False}
elif settings.database_url.startswith("postgresql"):
    # PostgreSQL-specific options (if needed)
    # connect_args = {"sslmode": "require"}
    pass
elif settings.database_url.startswith("mysql"):
    # MySQL-specific options (if needed)
    pass

# Create engine with conditional connect_args
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args=connect_args,
)

def create_db_and_tables():
    """Create all database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
```

**Why This Matters**: SQLite's `check_same_thread` option is invalid for PostgreSQL/MySQL and causes runtime errors.

---

## Connection String Formats

### PostgreSQL / Neon
```
postgresql://user:password@host:port/database?sslmode=require
```

### MySQL
```
mysql://user:password@host:port/database
```

### SQLite
```
sqlite:///path/to/database.db
```

### Turso (LibSQL)
```
libsql://your-db.turso.io
```

---

## Environment Variable Setup

### Frontend (.env.local)

```env
# Neon Serverless
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Supabase
DATABASE_URL="postgresql://user:pass@host/db"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"

# Turso
DATABASE_URL="libsql://your-db.turso.io"
DATABASE_AUTH_TOKEN="your-token"

# PostgreSQL (vanilla)
DATABASE_URL="postgresql://user:pass@host/db"

# MySQL
DATABASE_URL="mysql://user:pass@host/db"

# SQLite (dev only)
DATABASE_URL="sqlite:///./dev.db"
```

### Backend (.env)

```env
# Same DATABASE_URL as frontend
DATABASE_URL="postgresql://..."
```

---

## Migration Considerations

### PostgreSQL (All Variants)

**Better Auth CLI** works directly with PostgreSQL:
```bash
npx @better-auth/cli@latest migrate
```

**Tables Created**:
- `user` (id, email, emailVerified, name, createdAt, updatedAt)
- `session` (id, expiresAt, token, userId, createdAt, updatedAt)
- `account` (id, userId, providerId, accountId, createdAt, updatedAt)
- `verification` (id, identifier, value, expiresAt, createdAt, updatedAt)

### MySQL

**Better Auth supports MySQL**:
```bash
npx @better-auth/cli@latest migrate
```

**Note**: Ensure MySQL user has `CREATE TABLE` permissions.

### SQLite

**Better Auth supports SQLite**:
```bash
npx @better-auth/cli@latest migrate
```

**Warning**: SQLite is single-file, not suitable for production.

---

## Database-Specific Best Practices

### Neon Serverless

**Connection Pooling**:
- Neon's `Pool` handles pooling automatically
- Max connections: 100 (default)
- Idle timeout: 60 seconds

**SSL**:
- Always use `?sslmode=require`
- Neon enforces SSL for security

**Region**:
- Choose region close to your Next.js deployment
- Reduces latency

### Supabase

**Database Access**:
- Use `service_role` key for Better Auth (not `anon` key)
- `service_role` bypasses Row Level Security (RLS)

**RLS Considerations**:
- Better Auth tables should BYPASS RLS
- Create tables with `security invoker` off

**Pooling**:
- Supabase has built-in PgBouncer
- Connection limit: depends on plan

### PostgreSQL (Self-Hosted)

**Connection Limits**:
```python
# backend/src/db/database.py
engine = create_engine(
    settings.database_url,
    pool_size=5,          # Default: 5
    max_overflow=10,      # Max additional connections
    pool_pre_ping=True,   # Verify connections before use
)
```

**SSL Configuration**:
```python
import ssl

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_engine(
    settings.database_url,
    connect_args={"ssl": ssl_context}
)
```

### MySQL

**Character Set**:
```sql
CREATE DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Connection String**:
```
mysql://user:pass@host/db?charset=utf8mb4
```

---

## Troubleshooting

### Error: "SSL connection required"

**Neon/Supabase**:
```
DATABASE_URL="postgresql://...?sslmode=require"
```

### Error: "Too many connections"

**PostgreSQL**:
```python
# Reduce pool size
engine = create_engine(url, pool_size=3, max_overflow=5)
```

### Error: "check_same_thread" (PostgreSQL)

**Cause**: SQLite-specific option used with PostgreSQL

**Solution**: Use conditional `connect_args` (see above)

---

## Quick Reference

| Need | Use This |
|------|----------|
| Serverless PostgreSQL | Neon Serverless |
| Free PostgreSQL | Supabase |
| Edge-optimized | Turso (LibSQL) |
| Self-hosted | PostgreSQL |
| Dev only | SQLite |

**Recommendation**: Use Neon or Supabase for production. They're PostgreSQL-compatible and work seamlessly with Better Auth.
