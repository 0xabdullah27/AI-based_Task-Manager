# FastAPI Integration Patterns

Complete patterns for integrating Better Auth JWT verification with FastAPI backend.

---

## Architecture Overview

```
Next.js Frontend (:3000)
- Better Auth (session + JWT)
- HTTP-only cookies for session
- JWT tokens for API calls
         ↓
    JWT Bearer Token
         ↓
FastAPI Backend (:8000)
- JWT verification via JWKS
- EdDSA algorithm
- Protected endpoints
         ↓
PostgreSQL Database
```

---

## Complete File Structure

```
backend/
├── src/
│   ├── auth/
│   │   └── jwt_handler.py        # JWT verification with JWKS
│   ├── middleware/
│   │   └── auth.py                # Auth dependencies
│   ├── routes/
│   │   └── todos.py               # Protected endpoints
│   ├── config.py                  # JWT settings
│   └── main.py                    # CORS configuration
├── requirements.txt                # Dependencies
└── .env                            # Environment variables
```

---

## jwt_handler.py - Complete Implementation

```python
"""JWT verification using JWKS from Better Auth

Dependencies:
    pip install 'PyJWT[crypto]' cryptography 'python-jose[cryptography]'

Key Concepts:
    - JWKS (JSON Web Key Set): Public keys for JWT verification
    - EdDSA: Elliptic Curve Digital Signature Algorithm (Better Auth default)
    - PyJWKClient: Automatically fetches and caches public keys
"""

import jwt
from jwt import PyJWKClient
from typing import Dict, Any, Optional
from src.config import settings
import logging

logger = logging.getLogger(__name__)

# ========================================
# JWKS Client Configuration
# ========================================

# CRITICAL: JWKS URL must include /api/auth prefix
# Better Auth mounts at /api/auth, so JWKS is at /api/auth/.well-known/jwks.json
jwks_url = f"{settings.better_auth_url}/api/auth/.well-known/jwks.json"

# PyJWKClient automatically:
# 1. Fetches public keys from JWKS endpoint
# 2. Caches keys (JWKS doesn't change frequently)
# 3. Selects correct key based on token's 'kid' header
# 4. Refetches if 'kid' not found in cache
jwks_client = PyJWKClient(jwks_url)


# ========================================
# Core Verification Functions
# ========================================

def verify_jwt(token: str) -> Dict[str, Any]:
    """
    Verify JWT token using JWKS from Better Auth

    Process:
        1. Extract 'kid' (key ID) from token header
        2. Fetch public key from JWKS using 'kid'
        3. Verify token signature with public key
        4. Verify expiry time (automatic)
        5. Verify audience matches Better Auth URL
        6. Return decoded payload

    Args:
        token: JWT token string (from Authorization: Bearer header)

    Returns:
        Decoded token payload:
        {
            "sub": "user-abc-123",           # User ID
            "email": "user@example.com",     # User email
            "iat": 1705680000,               # Issued at
            "exp": 1705766400,               # Expiry
            "aud": "http://localhost:3000",  # Audience
        }

    Raises:
        jwt.ExpiredSignatureError: Token expired
        jwt.InvalidTokenError: Token invalid (signature, format, audience)

    Example:
        >>> token = "eyJhbGc..."
        >>> payload = verify_jwt(token)
        >>> user_id = payload["sub"]
    """
    try:
        # Step 1: Get signing key from JWKS based on token's 'kid' header
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Step 2: Decode and verify token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[settings.jwt_algorithm],  # EdDSA (Better Auth default)
            audience=settings.jwt_audience,       # Must match Better Auth URL
            # Optional: Verify issuer too
            # issuer=settings.jwt_issuer,
        )

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
        raise
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error verifying JWT: {e}", exc_info=True)
        raise jwt.InvalidTokenError(f"Token verification failed: {e}")


def get_user_id_from_token(token: str) -> str:
    """
    Extract user ID from JWT token

    Convenience function that verifies token and extracts 'sub' claim.

    Args:
        token: JWT token string

    Returns:
        User ID string

    Raises:
        jwt.InvalidTokenError: If token invalid or missing 'sub'

    Example:
        >>> token = request.headers.get("Authorization").replace("Bearer ", "")
        >>> user_id = get_user_id_from_token(token)
    """
    payload = verify_jwt(token)

    user_id = payload.get("sub")
    if not user_id:
        raise jwt.InvalidTokenError("Token missing 'sub' claim")

    return user_id


def get_user_email_from_token(token: str) -> str:
    """
    Extract user email from JWT token

    Args:
        token: JWT token string

    Returns:
        User email string

    Raises:
        jwt.InvalidTokenError: If token invalid or missing email
    """
    payload = verify_jwt(token)

    email = payload.get("email")
    if not email:
        raise jwt.InvalidTokenError("Token missing 'email' claim")

    return email


def get_token_expiry(token: str) -> int:
    """
    Get token expiry timestamp

    Args:
        token: JWT token string

    Returns:
        Unix timestamp (seconds since epoch)

    Example:
        >>> exp = get_token_expiry(token)
        >>> import time
        >>> if exp < time.time():
        >>>     print("Token expired")
    """
    payload = verify_jwt(token)
    return payload.get("exp", 0)


# ========================================
# Optional: Debugging Helpers
# ========================================

def decode_token_unverified(token: str) -> Dict[str, Any]:
    """
    Decode token WITHOUT verification (for debugging only)

    SECURITY WARNING: Never use in production code!
    Use only for debugging/logging token contents.

    Args:
        token: JWT token string

    Returns:
        Decoded payload (unverified)
    """
    import json
    import base64

    # JWT format: header.payload.signature
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")

    # Decode payload (base64url → JSON)
    payload_b64 = parts[1]
    # Add padding if needed
    payload_b64 += "=" * (4 - len(payload_b64) % 4)
    payload_json = base64.urlsafe_b64decode(payload_b64)
    payload = json.loads(payload_json)

    return payload


# ========================================
# Token Payload Structure (Reference)
# ========================================

# Example decoded JWT payload from Better Auth:
#
# {
#   "sub": "user-abc-123",            # User ID (subject)
#   "email": "user@example.com",      # User email
#   "name": "John Doe",               # User name (if available)
#   "iat": 1705680000,                # Issued at (Unix timestamp)
#   "exp": 1705766400,                # Expiry (Unix timestamp)
#   "aud": "http://localhost:3000",   # Audience (Better Auth URL)
#   "iss": "http://localhost:3000",   # Issuer (Better Auth URL)
# }
#
# Claims:
#   - sub (subject): User ID, always present
#   - email: User email, always present
#   - name: User display name, optional
#   - iat (issued at): Token creation time
#   - exp (expiry): Token expiration time (checked automatically)
#   - aud (audience): Prevents token reuse across services
#   - iss (issuer): Token issuer (Better Auth)
```

---

## auth.py - FastAPI Middleware/Dependencies

```python
"""Authentication middleware for FastAPI

Provides dependency injection for protected endpoints.

Usage:
    from src.middleware.auth import get_current_user_id

    @router.get("/api/todos")
    async def get_todos(user_id: str = Depends(get_current_user_id)):
        # user_id is automatically extracted and verified
        return {"user_id": user_id, "todos": []}
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.auth.jwt_handler import (
    verify_jwt,
    get_user_id_from_token,
    get_user_email_from_token,
)
import logging

logger = logging.getLogger(__name__)

# HTTPBearer security scheme
# Automatically extracts "Bearer <token>" from Authorization header
security = HTTPBearer()


# ========================================
# Core Authentication Dependencies
# ========================================

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    FastAPI dependency to get current user ID from JWT token

    Process:
        1. Extracts Bearer token from Authorization header
        2. Verifies token using JWKS
        3. Extracts user ID from token
        4. Returns user ID or raises 401

    Args:
        credentials: Automatically injected by FastAPI

    Returns:
        User ID (string)

    Raises:
        HTTPException(401): If token is invalid, expired, or missing

    Example:
        @router.get("/api/todos")
        async def get_todos(user_id: str = Depends(get_current_user_id)):
            todos = db.query(Todo).filter(Todo.user_id == user_id).all()
            return todos
    """
    try:
        # Extract token from credentials
        token = credentials.credentials

        # Verify and extract user ID
        user_id = get_user_id_from_token(token)

        logger.debug(f"Authenticated user: {user_id}")
        return user_id

    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_email(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Get user email from JWT token

    Example:
        @router.get("/api/profile")
        async def get_profile(email: str = Depends(get_current_user_email)):
            return {"email": email}
    """
    try:
        token = credentials.credentials
        email = get_user_email_from_token(token)
        return email
    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get full JWT payload

    Use when you need multiple claims (user ID, email, name, etc.)

    Returns:
        Full JWT payload dictionary

    Example:
        @router.get("/api/profile")
        async def get_profile(payload: dict = Depends(get_current_user_payload)):
            return {
                "user_id": payload["sub"],
                "email": payload["email"],
                "name": payload.get("name"),
            }
    """
    try:
        token = credentials.credentials
        payload = verify_jwt(token)
        return payload
    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ========================================
# Optional: Load User Model from Database
# ========================================

# If you want to load full User model from database:
#
# from src.models.user import User
# from src.db.database import get_session
# from sqlmodel import Session, select
#
# async def get_current_user(
#     user_id: str = Depends(get_current_user_id),
#     session: Session = Depends(get_session)
# ) -> User:
#     """Get current User model from database"""
#     user = session.exec(select(User).where(User.id == user_id)).first()
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="User not found"
#         )
#     return user


# ========================================
# Optional: Check Authorization Header Manually
# ========================================

def get_token_from_request(request: Request) -> str:
    """
    Manually extract token from request

    Use if you need custom auth logic outside Depends().

    Args:
        request: FastAPI Request object

    Returns:
        JWT token string

    Raises:
        HTTPException(401): If Authorization header missing or malformed
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format",
        )

    token = auth_header.replace("Bearer ", "")
    return token
```

---

## config.py - JWT Settings

```python
"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings"""

    # Database
    database_url: str = "sqlite:///./test.db"

    # ========================================
    # Better Auth JWT Configuration
    # ========================================

    # Frontend URL (where Better Auth is running)
    # CRITICAL: Must match audience in JWT tokens
    better_auth_url: str = "http://localhost:3000"

    # Shared secret (optional, for server-to-server if needed)
    better_auth_secret: str = "your-secret-key"

    # JWT Algorithm
    # CRITICAL: Better Auth uses EdDSA (Ed25519) by default
    # DO NOT change to RS256 unless you reconfigure Better Auth
    jwt_algorithm: str = "EdDSA"

    # JWT Audience
    # CRITICAL: Must match Better Auth URL
    # Prevents tokens from being used across different services
    jwt_audience: str = "http://localhost:3000"

    # Optional: JWT Issuer (usually same as audience)
    jwt_issuer: str = "http://localhost:3000"

    # ========================================
    # CORS Configuration
    # ========================================

    # Frontend URLs that can access this API
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    cors_allow_credentials: bool = True

    # ========================================
    # Application Settings
    # ========================================

    app_name: str = "Backend API"
    debug: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


# ========================================
# Configuration Validation (Optional)
# ========================================

import warnings

if settings.jwt_algorithm != "EdDSA":
    warnings.warn(
        f"JWT algorithm is {settings.jwt_algorithm}, but Better Auth uses EdDSA. "
        "Token verification may fail."
    )

if settings.jwt_audience != settings.better_auth_url:
    warnings.warn(
        f"JWT audience ({settings.jwt_audience}) doesn't match "
        f"Better Auth URL ({settings.better_auth_url}). "
        "Token verification may fail."
    )
```

---

## main.py - CORS Configuration

```python
"""FastAPI application with CORS"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.routes import todos

app = FastAPI(title=settings.app_name)

# ========================================
# CORS Middleware
# ========================================

# CRITICAL: Required for frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Frontend URLs
    allow_credentials=True,               # Allow cookies (optional for JWT)
    allow_methods=["*"],                  # Allow all HTTP methods
    allow_headers=["*"],                  # Allow all headers (including Authorization)
)

# Include routers
app.include_router(todos.router, prefix="/api", tags=["todos"])
```

---

## Protected Endpoint Examples

### Example 1: Get User's Todos
```python
from fastapi import APIRouter, Depends
from src.middleware.auth import get_current_user_id

router = APIRouter()

@router.get("/todos")
async def get_todos(user_id: str = Depends(get_current_user_id)):
    """
    Get all todos for authenticated user

    Authentication: Required (JWT Bearer token)
    Returns: List of todos for the user
    """
    # user_id is automatically extracted from JWT
    todos = db.query(Todo).filter(Todo.user_id == user_id).all()
    return {"user_id": user_id, "todos": todos}
```

### Example 2: Create Todo
```python
from pydantic import BaseModel

class TodoCreate(BaseModel):
    title: str
    description: str | None = None

@router.post("/todos")
async def create_todo(
    todo: TodoCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create new todo for authenticated user"""
    new_todo = Todo(
        user_id=user_id,
        title=todo.title,
        description=todo.description,
    )
    db.add(new_todo)
    db.commit()
    return new_todo
```

### Example 3: Get User Profile
```python
@router.get("/profile")
async def get_profile(payload: dict = Depends(get_current_user_payload)):
    """Get user profile from JWT token"""
    return {
        "user_id": payload["sub"],
        "email": payload["email"],
        "name": payload.get("name"),
    }
```

### Example 4: Public Endpoint (No Auth)
```python
@router.get("/public/health")
async def health_check():
    """Public health check endpoint (no authentication required)"""
    return {"status": "healthy"}
```

---

## Testing

### Unit Test: JWT Verification
```python
# tests/test_jwt.py
import pytest
from src.auth.jwt_handler import verify_jwt
import jwt

def test_verify_valid_jwt(valid_test_token):
    payload = verify_jwt(valid_test_token)
    assert payload["sub"] == "test-user-id"
    assert payload["email"] == "test@example.com"

def test_verify_expired_jwt(expired_test_token):
    with pytest.raises(jwt.ExpiredSignatureError):
        verify_jwt(expired_test_token)

def test_verify_invalid_signature(tampered_token):
    with pytest.raises(jwt.InvalidTokenError):
        verify_jwt(tampered_token)
```

### Integration Test: Protected Endpoint
```python
# tests/test_endpoints.py
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_protected_endpoint_without_token():
    response = client.get("/api/todos")
    assert response.status_code == 401

def test_protected_endpoint_with_valid_token(valid_test_token):
    headers = {"Authorization": f"Bearer {valid_test_token}"}
    response = client.get("/api/todos", headers=headers)
    assert response.status_code == 200
```

---

## Dependencies

```txt
# requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
PyJWT[crypto]==2.8.0
cryptography==41.0.7
python-jose[cryptography]==3.3.0
pydantic-settings==2.1.0
```

---

## Environment Variables

```env
# backend/.env
DATABASE_URL="postgresql://..."
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key"
JWT_ALGORITHM="EdDSA"
JWT_AUDIENCE="http://localhost:3000"
JWT_ISSUER="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

---

## Security Best Practices

1. **Always verify tokens** - Never trust tokens without verification
2. **Use HTTPS in production** - JWT tokens must be transmitted over HTTPS
3. **Validate audience** - Prevents token reuse across services
4. **Check expiry** - PyJWT does this automatically
5. **Log auth failures** - For security monitoring
6. **Rate limit auth endpoints** - Prevent brute force attacks
7. **Rotate secrets** - Change BETTER_AUTH_SECRET periodically
8. **Use strong secrets** - Generate with `openssl rand -base64 32`
