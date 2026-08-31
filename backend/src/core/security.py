"""JWT verification and authentication dependencies.

Merges auth/jwt_handler.py and auth/dependencies.py into a single module.
"""
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.core.config import settings

logger = logging.getLogger(__name__)

# JWKS client for Better Auth
jwks_url = f"{settings.better_auth_url}/api/auth/.well-known/jwks.json"
jwks_client = PyJWKClient(jwks_url)

# HTTP Bearer token security scheme (auto_error=False allows falling back to cookies)
security = HTTPBearer(auto_error=False)


def verify_jwt(token: str) -> Dict[str, Any]:
    """Verify JWT token using JWKS from Better Auth.

    Returns decoded token payload containing user information.
    Raises jwt.InvalidTokenError if token is invalid or expired.
    """
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
        )
        logger.debug(f"JWT verified successfully for user: {payload.get('sub')}")
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
    """Extract user ID from JWT token."""
    payload = verify_jwt(token)
    user_id = payload.get("sub")
    if not user_id:
        raise jwt.InvalidTokenError("Token missing 'sub' claim")
    return user_id


def verify_session_via_api(cookie_header: str) -> Optional[str]:
    """Fallback: Verify session cookie directly against Better Auth server."""
    try:
        req = urllib.request.Request(
            f"{settings.better_auth_url}/api/auth/get-session",
            headers={"Cookie": cookie_header},
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                user_id = data.get("user", {}).get("id") or data.get("session", {}).get("userId")
                return user_id
    except Exception as e:
        logger.debug(f"Better Auth get-session check failed: {e}")
    return None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """Dependency to get current authenticated user ID from Authorization header or Cookies."""
    token: Optional[str] = None

    # 1. Check Authorization Bearer header
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif request.headers.get("authorization"):
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()

    # 2. Check JWT cookies (set when session.cookieCache is enabled in Better Auth)
    if not token:
        for cookie_key in [
            "better-auth.session_data",
            "__Secure-better-auth.session_data",
            "session_data",
            "better_auth_jwt",
        ]:
            val = request.cookies.get(cookie_key)
            if val:
                token = val
                break

    # If a JWT token was found, verify via JWKS
    if token and token.count(".") == 2:
        try:
            return get_user_id_from_token(token)
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError as e:
            logger.debug(f"JWT verification failed, falling back to session verification: {e}")

    # 3. Fallback: Check opaque session cookies via Better Auth session API
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        user_id = verify_session_via_api(cookie_header)
        if user_id:
            return user_id

    # If all methods fail, return 401 Unauthorized
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
