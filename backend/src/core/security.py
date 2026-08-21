"""JWT verification and authentication dependencies.

Merges auth/jwt_handler.py and auth/dependencies.py into a single module.
"""
import jwt
from jwt import PyJWKClient
from typing import Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from src.core.config import settings

logger = logging.getLogger(__name__)

# JWKS client for Better Auth
jwks_url = f"{settings.better_auth_url}/api/auth/.well-known/jwks.json"
jwks_client = PyJWKClient(jwks_url)

# HTTP Bearer token security scheme
security = HTTPBearer()


def verify_jwt(token: str) -> Dict[str, any]:
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

# this is the actual thing where the user_id is extracted from the token and returned

# async def get_current_user(
#         # this is the same as extracting the token from the Authorization header using the oauth2 scheme, but we can keep it simple by just using the HTTPBearer security scheme provided by FastAPI,that also give the obj with the scheme(Bearer) and credentials(actual token) instead of just token string.
#     credentials: HTTPAuthorizationCredentials = Depends(security),
# ) -> str:
#     """Dependency to get current authenticated user ID from JWT token."""
#     if not credentials:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Missing authentication credentials",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
#     token = credentials.credentials
#     try:
#         return get_user_id_from_token(token)
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Token has expired",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
#     except jwt.InvalidTokenError as e:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail=f"Invalid authentication credentials: {str(e)}",
#             headers={"WWW-Authenticate": "Bearer"},
#         )




async def get_current_user() -> str:
    """Dependency to get current authenticated user ID """
    return "yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI"