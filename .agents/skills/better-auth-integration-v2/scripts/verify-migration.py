#!/usr/bin/env python3
"""
Verify Better Auth migration completed successfully

Usage:
    python scripts/verify-migration.py

Environment:
    DATABASE_URL - PostgreSQL/MySQL/SQLite connection string
"""

import sys
import os
from sqlalchemy import create_engine, inspect
from urllib.parse import urlparse

def verify_migration(database_url: str) -> bool:
    """Verify Better Auth migration completed successfully"""

    required_tables = {'user', 'session', 'account', 'verification'}
    required_user_columns = {'id', 'email', 'createdAt'}
    required_session_columns = {'id', 'userId', 'expiresAt', 'token'}

    try:
        # Connect to database
        print(f"🔍 Connecting to database...")
        engine = create_engine(database_url)
        inspector = inspect(engine)

        # Get existing tables
        existing_tables = set(inspector.get_table_names())
        print(f"📊 Found {len(existing_tables)} tables in database")

        # Check required tables exist
        missing_tables = required_tables - existing_tables

        if missing_tables:
            print(f"\n❌ Missing tables: {', '.join(sorted(missing_tables))}")
            print(f"\n💡 Run: npx @better-auth/cli@latest migrate")
            return False

        print(f"\n✅ All required tables exist:")
        for table in sorted(required_tables):
            columns = [col['name'] for col in inspector.get_columns(table)]
            print(f"  ✓ {table} ({len(columns)} columns)")

        # Verify critical columns in user table
        print(f"\n🔍 Verifying user table structure...")
        user_columns = {col['name'] for col in inspector.get_columns('user')}

        if not required_user_columns.issubset(user_columns):
            missing_cols = required_user_columns - user_columns
            print(f"❌ User table missing required columns: {', '.join(missing_cols)}")
            return False

        print(f"  ✓ User table has all required columns")

        # Verify critical columns in session table
        print(f"\n🔍 Verifying session table structure...")
        session_columns = {col['name'] for col in inspector.get_columns('session')}

        if not required_session_columns.issubset(session_columns):
            missing_cols = required_session_columns - session_columns
            print(f"❌ Session table missing required columns: {', '.join(missing_cols)}")
            return False

        print(f"  ✓ Session table has all required columns")

        # Verify foreign keys
        print(f"\n🔍 Verifying foreign key constraints...")
        session_fks = inspector.get_foreign_keys('session')
        account_fks = inspector.get_foreign_keys('account')

        if not session_fks:
            print(f"⚠️  Warning: No foreign keys found on session table")
        else:
            print(f"  ✓ Session table has {len(session_fks)} foreign key(s)")

        if not account_fks:
            print(f"⚠️  Warning: No foreign keys found on account table")
        else:
            print(f"  ✓ Account table has {len(account_fks)} foreign key(s)")

        # Verify indexes
        print(f"\n🔍 Verifying indexes...")
        user_indexes = inspector.get_indexes('user')
        session_indexes = inspector.get_indexes('session')

        print(f"  ✓ User table has {len(user_indexes)} index(es)")
        print(f"  ✓ Session table has {len(session_indexes)} index(es)")

        print("\n" + "="*60)
        print("✅ Migration verification passed!")
        print("="*60)
        print("\n📋 Next steps:")
        print("  1. Start your Next.js dev server: npm run dev")
        print("  2. Test sign-up flow: http://localhost:3000/sign-up")
        print("  3. Test sign-in flow: http://localhost:3000/sign-in")
        print("  4. Verify JWT token in localStorage")
        print("\n")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print(f"\n💡 Troubleshooting:")
        print(f"  - Verify DATABASE_URL is correct")
        print(f"  - Ensure database is running and accessible")
        print(f"  - Check .env file exists with DATABASE_URL")
        return False

def main():
    """Main entry point"""
    # Try to load .env file
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("⚠️  python-dotenv not installed, using system environment only")

    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        print("\n💡 Solutions:")
        print("  1. Create .env file with: DATABASE_URL=\"postgresql://...\"")
        print("  2. Export in terminal: export DATABASE_URL=\"postgresql://...\"")
        sys.exit(1)

    # Parse and display connection info (without password)
    parsed = urlparse(database_url)
    safe_url = f"{parsed.scheme}://{parsed.hostname}:{parsed.port or 'default'}/{parsed.path.lstrip('/')}"
    print(f"🌐 Database: {safe_url}\n")

    # Run verification
    success = verify_migration(database_url)

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
