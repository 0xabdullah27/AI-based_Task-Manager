"""Rate limiting configuration using slowapi with User ID and IP fallback."""
import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address


def get_rate_limit_key(request: Request) -> str:
    """Extract user_id from JWT Authorization header if present, falling back to client IP."""
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        try:
            # Fast unverified decode to read 'sub' for rate-limiting bucket
            # (Cryptographic verification is performed by route dependencies)
            payload = jwt.decode(token, options={"verify_signature": False, "verify_aud": False})
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass

    # Fallback to IP address for unauthenticated requests
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=["120/minute"],
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return a user-friendly 429 Too Many Requests response."""
    limit_detail = str(exc.detail) if exc.detail else "Rate limit reached"
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"You're making requests too quickly. Please slow down and wait a moment before trying again. ({limit_detail})",
            "error_code": "RATE_LIMIT_EXCEEDED",
            "retry_after": 60,
        },
        headers={"Retry-After": "60"},
    )
