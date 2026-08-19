# Better Auth + FastAPI Integration Patterns

## Overview

Better Auth (frontend) + FastAPI (backend) integration using JWT tokens for stateless authentication.

## Authentication Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │     │   Better Auth   │     │  FastAPI API    │
│   (Frontend)    │     │   (Auth Server) │     │   (Backend)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. User signs in      │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 2. Session created    │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │ 3. Request JWT token  │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 4. JWT returned       │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │ 5. API request + JWT  │                       │
         │─────────────────────────────────────────────>│
         │                       │                       │
         │                       │ 6. Verify JWT via JWKS│
         │                       │<──────────────────────│
         │                       │                       │
         │ 7. Protected response │                       │
         │<─────────────────────────────────────────────│
```

## Frontend Setup (Better Auth)

### 1. Configure Better Auth with JWT Plugin

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  // ... database config
  plugins: [
    jwt(), // Enable JWT token generation
  ],
});
```

### 2. Configure Auth Client with JWT Client Plugin

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    jwtClient(), // Enable JWT token retrieval
  ],
});
```

### 3. Get JWT Token for API Calls

```typescript
// Method 1: Using jwtClient (recommended)
const { data, error } = await authClient.token();
if (data) {
  const jwtToken = data.token;
  // Use this token for authenticated requests to FastAPI
}

// Method 2: From session response header
await authClient.getSession({
  fetchOptions: {
    onSuccess: (ctx) => {
      const jwt = ctx.response.headers.get("set-auth-jwt");
      // Store and use this token
    },
  },
});
```

### 4. Make Authenticated API Calls

```typescript
// lib/api.ts
import { authClient } from "./auth-client";

export async function fetchFromBackend(endpoint: string) {
  const { data } = await authClient.token();

  if (!data?.token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${data.token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

## Backend Setup (FastAPI)

### 1. Install Dependencies

```bash
pip install fastapi python-jose[cryptography] httpx
```

### 2. JWT Verification with JWKS

```python
# auth/jwt_handler.py
from jose import jwt, jwk, JWTError
from jose.utils import base64url_decode
import httpx
from functools import lru_cache
from datetime import datetime, timezone

BETTER_AUTH_URL = "http://localhost:3000"  # Your Next.js app URL
JWKS_URL = f"{BETTER_AUTH_URL}/api/auth/jwks"

# Cache JWKS to avoid fetching on every request
@lru_cache(maxsize=1)
def get_jwks():
    """Fetch and cache JWKS from Better Auth"""
    response = httpx.get(JWKS_URL)
    response.raise_for_status()
    return response.json()

def get_public_key(token: str):
    """Get the public key matching the token's kid"""
    jwks = get_jwks()

    # Get kid from token header
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")

    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key

    # If kid not found, refresh cache and try again
    get_jwks.cache_clear()
    jwks = get_jwks()

    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key

    raise JWTError("Unable to find matching key")

def verify_jwt(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        public_key = get_public_key(token)

        # Determine algorithm from key
        alg = public_key.get("alg", "EdDSA")

        payload = jwt.decode(
            token,
            public_key,
            algorithms=[alg],
            issuer=BETTER_AUTH_URL,
            audience=BETTER_AUTH_URL,
        )

        return payload
    except JWTError as e:
        raise ValueError(f"Token validation failed: {str(e)}")
```

### 3. FastAPI Dependencies

```python
# auth/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from .jwt_handler import verify_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get current authenticated user from JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = verify_jwt(token)
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        return {
            "id": user_id,
            "email": payload.get("email"),
            "name": payload.get("name"),
        }
    except ValueError:
        raise credentials_exception
```

### 4. Protected Routes

```python
# main.py
from fastapi import FastAPI, Depends
from auth.dependencies import get_current_user

app = FastAPI()

@app.get("/api/todos")
async def get_todos(current_user: dict = Depends(get_current_user)):
    """Protected endpoint - requires valid JWT"""
    user_id = current_user["id"]
    # Fetch todos for this user from database
    return {"user_id": user_id, "todos": []}

@app.post("/api/todos")
async def create_todo(
    todo: TodoCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create todo for authenticated user"""
    user_id = current_user["id"]
    # Create todo in database
    return {"message": "Todo created", "user_id": user_id}
```

## CORS Configuration

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Gotchas

1. **JWKS Caching**: Always cache JWKS to avoid rate limiting. Refresh only when `kid` doesn't match.

2. **Algorithm Mismatch**: Better Auth default is EdDSA (Ed25519). Ensure your JWT library supports it.

3. **Issuer/Audience**: Must match your Better Auth `baseURL` exactly.

4. **Token Expiration**: Better Auth JWT expires in 15 minutes by default. Handle refresh appropriately.

5. **CORS**: Ensure CORS is configured to allow your frontend origin.

## Security Best Practices

1. Use HTTPS in production
2. Set appropriate token expiration times
3. Implement token refresh before expiration
4. Validate all JWT claims (iss, aud, exp)
5. Use environment variables for URLs and secrets
