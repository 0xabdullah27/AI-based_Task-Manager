"""Request/response logging middleware with X-Process-Time header."""
import time
import logging
from fastapi import Request


logger = logging.getLogger(__name__)


async def logging_middleware(request: Request, call_next):
    """Log incoming requests and responses with timing, add X-Process-Time header."""
    start_time = time.time()

    logger.info(f"{request.method} {request.url.path}")

    response = await call_next(request)

    duration = time.time() - start_time
    response.headers["X-Process-Time"] = f"{duration:.4f}"

    logger.info(
        f"{request.method} {request.url.path} "
        f"status={response.status_code} duration={duration:.3f}s"
    )

    return response
