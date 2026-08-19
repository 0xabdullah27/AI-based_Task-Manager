# Migration Guide

Complete guide to Better Auth CLI migration, .env file behavior, and table verification.

---

## Better Auth CLI Overview

**Purpose:** Creates Better Auth database tables (user, session, account, verification)

**Command:**
```bash
npx @better-auth/cli@latest migrate
```

**What it does:**
1. Reads database connection from `.env` file (NOT `.env.local`)
2. Connects to database
3. Creates Better Auth tables if they don't exist
4. Runs any pending schema migrations
5. Verifies tables created successfully

---

## Environment File Behavior

### Why Two .env Files?

**Problem:** CLI tools and Next.js read different environment files.

| Tool | Reads From | Why |
|------|------------|-----|
| **Next.js** | `.env.local` | Framework convention for local development |
| **Better Auth CLI** | `.env` | Standard CLI convention (not Next.js-aware) |
| **Other CLI tools** | `.env` | Standard across all frameworks |

### Solution: Create Both Files

**Option 1: Temporary Copy (Recommended)**

```bash
# Before migration
cp frontend/.env.local frontend/.env

# Run migration
npx @better-auth/cli@latest migrate

# After migration (optional cleanup)
rm frontend/.env  # Next.js doesn't need this
```

**Option 2: Permanent .env File**

```bash
# Create .env with DATABASE_URL only
echo "DATABASE_URL=\"$DATABASE_URL\"" > frontend/.env

# Keep both files
# - .env.local for Next.js
# - .env for CLI tools
```

**Option 3: Environment Variable Export**

```bash
# Export DATABASE_URL in terminal
export DATABASE_URL="postgresql://..."

# Run migration (will use exported variable)
npx @better-auth/cli@latest migrate

# Note: Export is temporary (lost when terminal closes)
```

---

## Migration Process

### Step-by-Step

#### 1. Verify Database Connection String

**Check .env.local:**
```env
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
```

**Validate connection string:**
```bash
# Test connection (PostgreSQL)
psql "$DATABASE_URL" -c "SELECT 1;"

# Should output: (1 row)
```

#### 2. Create .env File

```bash
cd frontend

# Copy entire .env.local to .env
cp .env.local .env

# Or copy just DATABASE_URL
grep DATABASE_URL .env.local > .env
```

#### 3. Run Migration

```bash
npx @better-auth/cli@latest migrate
```

**Expected Output:**

```
⚡ Better Auth Migration

Connecting to database...
✓ Connected to PostgreSQL

Running migrations...
✓ Created table: user
✓ Created table: session
✓ Created table: account
✓ Created table: verification

✓ Migration complete!
```

**Possible Errors:**

```
❌ Error: No database host or connection string was set
→ Solution: Create .env file with DATABASE_URL

❌ Error: Connection refused
→ Solution: Verify database is running and connection string is correct

❌ Error: SSL connection required
→ Solution: Add ?sslmode=require to connection string

❌ Error: Authentication failed
→ Solution: Verify username/password in connection string
```

#### 4. Verify Tables Created

**Query database:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user', 'session', 'account', 'verification');
```

**Expected result:**
```
 table_name
--------------
 user
 session
 account
 verification
(4 rows)
```

**Alternative verification (psql):**
```bash
psql "$DATABASE_URL" -c "\dt"
```

#### 5. Cleanup (Optional)

```bash
# Delete .env if you don't need it for future migrations
rm frontend/.env

# Next.js will continue using .env.local
```

---

## Table Schemas

### User Table

```sql
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,                    -- Unique user ID (UUID or nanoid)
  email TEXT UNIQUE NOT NULL,             -- User email
  emailVerified BOOLEAN DEFAULT FALSE,    -- Email verification status
  name TEXT,                              -- User display name
  image TEXT,                             -- Profile image URL
  createdAt TIMESTAMP DEFAULT NOW(),      -- Account creation timestamp
  updatedAt TIMESTAMP DEFAULT NOW()       -- Last update timestamp
);
```

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

### Session Table

```sql
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,                    -- Session ID
  expiresAt TIMESTAMP NOT NULL,           -- Session expiry timestamp
  token TEXT UNIQUE NOT NULL,             -- Session token (stored in cookie)
  userId TEXT NOT NULL,                   -- Foreign key to user.id
  ipAddress TEXT,                         -- IP address of session
  userAgent TEXT,                         -- Browser user agent
  createdAt TIMESTAMP DEFAULT NOW(),      -- Session start timestamp
  updatedAt TIMESTAMP DEFAULT NOW(),      -- Last activity timestamp

  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);
```

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `token`
- INDEX on `userId` (for foreign key lookups)
- INDEX on `expiresAt` (for cleanup queries)

### Account Table

```sql
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,                    -- Account ID
  userId TEXT NOT NULL,                   -- Foreign key to user.id
  accountId TEXT NOT NULL,                -- Provider-specific account ID
  providerId TEXT NOT NULL,               -- OAuth provider (google, github, etc.)
  accessToken TEXT,                       -- OAuth access token
  refreshToken TEXT,                      -- OAuth refresh token
  expiresAt TIMESTAMP,                    -- Token expiry
  scope TEXT,                             -- OAuth scopes
  password TEXT,                          -- Hashed password (for email/password)
  createdAt TIMESTAMP DEFAULT NOW(),      -- Account creation timestamp
  updatedAt TIMESTAMP DEFAULT NOW(),      -- Last update timestamp

  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE,
  UNIQUE(providerId, accountId)           -- One account per provider
);
```

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `(providerId, accountId)`
- INDEX on `userId` (for foreign key lookups)

### Verification Table

```sql
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,                    -- Verification ID
  identifier TEXT NOT NULL,               -- Email or phone number
  value TEXT NOT NULL,                    -- Verification token
  expiresAt TIMESTAMP NOT NULL,           -- Token expiry
  createdAt TIMESTAMP DEFAULT NOW(),      -- Creation timestamp
  updatedAt TIMESTAMP DEFAULT NOW()       -- Update timestamp
);
```

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `identifier` (for lookups)
- INDEX on `value` (for token verification)
- INDEX on `expiresAt` (for cleanup queries)

---

## Database-Specific Notes

### PostgreSQL / Neon / Supabase

**Connection String Format:**
```
postgresql://username:password@hostname:5432/database?sslmode=require
```

**SSL Requirement:**
- Neon: **Required** (`?sslmode=require`)
- Supabase: **Required** (`?sslmode=require`)
- Local PostgreSQL: Optional

**Migration Notes:**
- Works out of the box
- No special configuration needed
- Tables created in `public` schema

**Permissions Required:**
- `CREATE TABLE`
- `CREATE INDEX`
- `ALTER TABLE`

### MySQL

**Connection String Format:**
```
mysql://username:password@hostname:3306/database
```

**Character Set:**
```sql
-- Ensure database uses UTF-8
CREATE DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Migration Notes:**
- Better Auth creates tables with `utf8mb4` encoding
- Ensure user has CREATE TABLE permissions

**Differences from PostgreSQL:**
- Uses `VARCHAR(255)` instead of `TEXT` for some columns
- Timestamp precision may differ

### SQLite

**Connection String Format:**
```
sqlite:///path/to/database.db
```

**Migration Notes:**
- File-based database (creates file if doesn't exist)
- No network connection required
- **NOT recommended for production**

**Limitations:**
- Single connection (poor for concurrent requests)
- Limited ALTER TABLE support
- No native UUID type

**Use Case:**
- Development only
- Quick testing
- Prototyping

---

## Verification Scripts

### Manual Verification (psql)

```bash
# List all tables
psql "$DATABASE_URL" -c "\dt"

# Check specific Better Auth tables
psql "$DATABASE_URL" -c "
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('user', 'session', 'account', 'verification')
ORDER BY table_name, ordinal_position;
"

# Count rows in each table
psql "$DATABASE_URL" -c "
SELECT 'user' as table_name, COUNT(*) FROM \"user\"
UNION ALL
SELECT 'session', COUNT(*) FROM session
UNION ALL
SELECT 'account', COUNT(*) FROM account
UNION ALL
SELECT 'verification', COUNT(*) FROM verification;
"
```

### Automated Verification (Python)

```python
# scripts/verify-migration.py
import sys
import os
from sqlalchemy import create_engine, inspect
from urllib.parse import urlparse

def verify_migration(database_url: str) -> bool:
    """Verify Better Auth migration completed successfully"""

    required_tables = {'user', 'session', 'account', 'verification'}

    try:
        # Connect to database
        engine = create_engine(database_url)
        inspector = inspect(engine)

        # Get existing tables
        existing_tables = set(inspector.get_table_names())

        # Check required tables exist
        missing_tables = required_tables - existing_tables

        if missing_tables:
            print(f"❌ Missing tables: {missing_tables}")
            return False

        print("✅ All required tables exist:")
        for table in required_tables:
            columns = [col['name'] for col in inspector.get_columns(table)]
            print(f"  - {table} ({len(columns)} columns)")

        # Verify critical columns
        user_columns = {col['name'] for col in inspector.get_columns('user')}
        required_user_columns = {'id', 'email', 'createdAt'}

        if not required_user_columns.issubset(user_columns):
            print(f"❌ User table missing required columns")
            return False

        print("\n✅ Migration verification passed!")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not set")
        sys.exit(1)

    success = verify_migration(database_url)
    sys.exit(0 if success else 1)
```

**Usage:**
```bash
python scripts/verify-migration.py
```

---

## Common Migration Issues

### Issue: "No database host or connection string was set"

**Cause:** Better Auth CLI can't find DATABASE_URL

**Diagnosis:**
```bash
# Check if .env exists
ls -la frontend/.env

# Check if DATABASE_URL is in .env
grep DATABASE_URL frontend/.env
```

**Solution:**
```bash
# Create .env from .env.local
cp frontend/.env.local frontend/.env

# Or set environment variable
export DATABASE_URL="postgresql://..."
```

---

### Issue: "Connection refused" / "Connection timeout"

**Cause:** Database not reachable

**Diagnosis:**
```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Check database is running (local PostgreSQL)
pg_isready

# Check network connectivity (remote database)
ping hostname
telnet hostname 5432
```

**Solution:**
- Verify database is running
- Check firewall rules
- Verify connection string hostname/port

---

### Issue: "SSL connection required"

**Cause:** Database requires SSL but connection string doesn't specify it

**Diagnosis:**
```bash
# Check if connection string has sslmode
echo "$DATABASE_URL" | grep sslmode
```

**Solution:**
```env
# Add ?sslmode=require to connection string
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

---

### Issue: "Authentication failed"

**Cause:** Incorrect username/password

**Diagnosis:**
```bash
# Test credentials manually
psql "$DATABASE_URL" -c "SELECT 1;"
```

**Solution:**
- Verify username/password in database provider dashboard
- Copy connection string exactly (watch for special characters)
- Ensure connection string is URL-encoded if it contains special chars

---

### Issue: "Permission denied to create table"

**Cause:** Database user lacks CREATE TABLE permission

**Diagnosis:**
```bash
# Check user permissions (PostgreSQL)
psql "$DATABASE_URL" -c "
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = current_user
AND table_schema = 'public';
"
```

**Solution:**
```sql
-- Grant CREATE permission (run as superuser)
GRANT CREATE ON SCHEMA public TO your_user;
```

---

### Issue: Tables exist but migration fails

**Cause:** Partial migration or schema mismatch

**Solution:**
```bash
# Option 1: Drop existing tables and retry
psql "$DATABASE_URL" -c "
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS \"user\" CASCADE;
"

# Then run migration again
npx @better-auth/cli@latest migrate

# Option 2: Use Better Auth reset command (if available)
npx @better-auth/cli@latest reset
npx @better-auth/cli@latest migrate
```

---

## Migration Rollback

### Manual Rollback

```sql
-- Drop all Better Auth tables
-- ⚠️ WARNING: This deletes all user data!

DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
```

### Backup Before Migration

```bash
# PostgreSQL - Backup database
pg_dump "$DATABASE_URL" > backup_before_migration.sql

# PostgreSQL - Restore from backup
psql "$DATABASE_URL" < backup_before_migration.sql

# MySQL - Backup database
mysqldump -h hostname -u username -p database > backup.sql

# MySQL - Restore from backup
mysql -h hostname -u username -p database < backup.sql
```

---

## Post-Migration Checklist

```markdown
## Migration Checklist

- [ ] .env file created with DATABASE_URL
- [ ] Migration command executed successfully
- [ ] All 4 tables exist (user, session, account, verification)
- [ ] User table has required columns (id, email, createdAt)
- [ ] Session table has foreign key to user
- [ ] Can insert test user (optional verification)
- [ ] .env file deleted (optional cleanup)
- [ ] Next.js dev server restarted
```

---

## Environment Variable Reference

### Required for Migration

```env
# .env (for Better Auth CLI)
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
```

### Full Frontend Configuration

```env
# .env.local (for Next.js)
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="<random-string>"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:8000"  # If separate backend
```

### Full Backend Configuration

```env
# backend/.env
DATABASE_URL="postgresql://..."
BETTER_AUTH_URL="http://localhost:3000"
JWT_ALGORITHM="EdDSA"
JWT_AUDIENCE="http://localhost:3000"
```

---

## CLI Command Reference

```bash
# Run migration
npx @better-auth/cli@latest migrate

# Show CLI help
npx @better-auth/cli@latest --help

# Generate types (if using TypeScript)
npx @better-auth/cli@latest generate

# Version info
npx @better-auth/cli@latest --version
```

---

## Production Migration

### Staging Environment

```bash
# 1. Test migration on staging first
export DATABASE_URL="<staging-database-url>"
npx @better-auth/cli@latest migrate

# 2. Verify tables in staging
psql "$DATABASE_URL" -c "\dt"

# 3. Test authentication flow in staging
# - Sign up
# - Sign in
# - API calls
```

### Production Environment

```bash
# 1. Backup production database first
pg_dump "$PROD_DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migration on production
export DATABASE_URL="<production-database-url>"
npx @better-auth/cli@latest migrate

# 3. Verify migration
# 4. Test critical flows
# 5. Monitor for errors
```

### Zero-Downtime Migration

```bash
# 1. Run migration (tables created, no data affected)
npx @better-auth/cli@latest migrate

# 2. Deploy new code with Better Auth integration
# (Old code continues working during deployment)

# 3. Verify new authentication works

# 4. Gradually migrate existing users (if migrating from old auth)
```

---

## Quick Reference

### Essential Commands

```bash
# Create .env for migration
cp .env.local .env

# Run migration
npx @better-auth/cli@latest migrate

# Verify tables
psql "$DATABASE_URL" -c "\dt"

# Cleanup
rm .env
```

### Essential Environment Variables

```env
# Minimum for migration
DATABASE_URL="postgresql://..."

# Minimum for Better Auth
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="<random>"
```

### Essential Queries

```sql
-- List tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Count users
SELECT COUNT(*) FROM "user";

-- Recent sessions
SELECT * FROM session ORDER BY createdAt DESC LIMIT 10;
```
