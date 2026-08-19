---
name: production-jwt-auth
description: Production-grade manual authentication with FastAPI as the Auth Authority and Next.js as the client. Covers password hashing (bcrypt), short-lived access tokens, refresh token rotation with reuse detection in PostgreSQL, httpOnly secure cookies, frontend silent refresh with Axios interceptors, request queuing, and localStorage options with security tradeoffs. Use this skill whenever building custom JWT authentication, refresh token rotation systems, login/register/logout endpoints, and 401 retry interceptors without third-party auth services.
---

# Production Manual JWT Auth (FastAPI Authority + Refresh Tokens)

Comprehensive guide for building custom, production-grade JWT authentication where **FastAPI** generates, signs, and manages token pairs with **Refresh Token Rotation**, and **Next.js** handles silent refresh via `httpOnly` cookies.

---

## 🧭 Scope & Architecture Pattern (Pattern B)

```
FastAPI (Auth Authority)                   Next.js (Consumer)
┌────────────────────────────────┐         ┌────────────────────────────────┐
│  /auth/login, /auth/refresh    │         │  Client State                  │
│  - Password hashing (bcrypt)   │         │  - Access Token (in-memory)    │
│  - Access Token (15 min TTL)   │──Tokens─▶│  - Refresh Token (httpOnly)   │
│  - Refresh Token (7-30d TTL)   │         │  - Axios 401 Silent Refresh    │
│  - Rotation & Reuse Detection  │         │  - Request Concurrency Queue   │
└────────────────────────────────┘         └────────────────────────────────┘
```

| Area | Ownership |
|---|---|
| **Backend JWT Issuance & Routes** | ✅ **Covered in this skill** (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`) |
| **Password Hashing & Verification** | ✅ **Covered in this skill** (`pwd_context` with `bcrypt`) |
| **Refresh Token DB & Rotation** | ✅ **Covered in this skill** (PostgreSQL `RefreshToken` model, JTI, reuse detection) |
| **Cookie Security & Options** | ✅ **Covered in this skill** (`httpOnly`, `Secure`, `SameSite=Lax`, vs `localStorage` tradeoffs) |
| **Frontend Silent Refresh Queue** | ✅ **Covered in this skill** (Axios 401 interceptor, queuing pending requests) |
| **Better Auth Library** | ❌ **NOT covered here**. For Next.js Better Auth with JWKS, use `better-auth-fullstack`. |

---

## 🔒 Security Best Practices (2025/2026 Standard)

1.  **Access Token**: Short-lived (10–15 minutes). Kept **in-memory** in frontend state/Axios header to prevent XSS theft.
2.  **Refresh Token**: Long-lived (7–30 days). Stored in an **`httpOnly`**, **`Secure`**, **`SameSite=Lax`** cookie (inaccessible to JavaScript).
3.  **Rotation on Every Use**: Every `/auth/refresh` call invalidates the old refresh token and issues a new pair.
4.  **Reuse Detection**: If an already-revoked refresh token is presented, trigger a security alarm and **revoke all active sessions** for that user immediately.
5.  **Hash Stored Tokens**: Never store raw refresh tokens in the database; store their SHA256 / bcrypt hashes.

---

## 🐍 Backend Implementation (FastAPI)

### 1. Database Schema (`src/models/auth.py`)
```python
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class RefreshToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    jti: str = Field(unique=True, index=True) # Unique Token ID (UUID4)
    user_id: str = Field(index=True)
    token_hash: str # Hash of the refresh token string
    expires_at: datetime
    revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 2. Token Helpers (`src/core/security.py`)
```python
import uuid
import hashlib
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from src.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=15)
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")

def create_refresh_token(user_id: str) -> tuple[str, str, datetime]:
    jti = str(uuid.uuid4())
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {"sub": user_id, "jti": jti, "exp": expire, "type": "refresh"}
    token = jwt.encode(payload, settings.secret_key, algorithm="HS256")
    return token, jti, expire
```

### 3. Auth Router & Cookie Management (`src/routers/auth.py`)
```python
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.database import get_db
from src.models.auth import RefreshToken
from src.core.security import (
    create_access_token, create_refresh_token, hash_token,
    verify_password, hash_password
)
import jwt

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
async def login(
    credentials: UserLoginDTO, response: Response, db: AsyncSession = Depends(get_db)
):
    # Verify user credentials
    user = await authenticate_user(credentials.email, credentials.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate token pair
    access_token = create_access_token(str(user.id))
    refresh_token, jti, expire = create_refresh_token(str(user.id))

    # Persist hashed refresh token in DB
    db_token = RefreshToken(
        jti=jti,
        user_id=str(user.id),
        token_hash=hash_token(refresh_token),
        expires_at=expire,
    )
    db.add(db_token)
    await db.commit()

    # Set httpOnly cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh")
async def refresh_tokens(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
):
    raw_token = request.cookies.get("refresh_token")
    if not raw_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    try:
        payload = jwt.decode(raw_token, settings.secret_key, algorithms=["HS256"])
        jti, user_id = payload.get("jti"), payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Look up token in database
    result = await db.exec(select(RefreshToken).where(RefreshToken.jti == jti))
    stored_token = result.first()

    # Reuse detection check: If token does not exist or is already revoked
    if not stored_token or stored_token.revoked:
        # Compromise detected: Revoke all tokens for this user
        all_tokens = await db.exec(select(RefreshToken).where(RefreshToken.user_id == user_id))
        for t in all_tokens:
            t.revoked = True
        await db.commit()
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Session compromised. Please log in again.")

    # Invalidate old refresh token (Rotation)
    stored_token.revoked = True

    # Generate new token pair
    new_access_token = create_access_token(user_id)
    new_refresh_token, new_jti, new_expire = create_refresh_token(user_id)

    new_db_token = RefreshToken(
        jti=new_jti,
        user_id=user_id,
        token_hash=hash_token(new_refresh_token),
        expires_at=new_expire,
    )
    db.add(new_db_token)
    await db.commit()

    # Set updated cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )

    return {"access_token": new_access_token, "token_type": "bearer"}
```

---

## 💻 Frontend Implementation (Next.js + Axios)

### 1. In-Memory Token Manager (`src/lib/token-manager.ts`)
```typescript
let inMemoryAccessToken: string | null = null;

export const tokenManager = {
  getToken: () => inMemoryAccessToken,
  setToken: (token: string | null) => { inMemoryAccessToken = token; },
  clear: () => { inMemoryAccessToken = null; },
};
```

### 2. Axios Instance with Silent Refresh Queue (`src/lib/api-client.ts`)
```typescript
import axios from "axios";
import { tokenManager } from "./token-manager";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true, // Send httpOnly cookies with requests
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

// Request interceptor: attach memory access token
apiClient.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 with silent refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        tokenManager.setToken(data.access_token);
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenManager.clear();
        if (typeof window !== "undefined") window.location.href = "/sign-in";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```
