"""Exception handlers converting domain exceptions to structured FastAPI HTTP JSON responses."""
from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

from src.exceptions.base import (
    TaskNotFoundError,
    TagNotFoundError,
    ConversationNotFoundError,
    UnauthorizedError,
    ValidationError,
)

logger = logging.getLogger(__name__)


async def task_not_found_handler(request: Request, exc: TaskNotFoundError) -> JSONResponse:
    """Handle TaskNotFoundError and return HTTP 404 response."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc), "code": "TASK_NOT_FOUND"},
    )


async def tag_not_found_handler(request: Request, exc: TagNotFoundError) -> JSONResponse:
    """Handle TagNotFoundError and return HTTP 404 response."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc), "code": "TAG_NOT_FOUND"},
    )


async def conversation_not_found_handler(
    request: Request, exc: ConversationNotFoundError
) -> JSONResponse:
    """Handle ConversationNotFoundError and return HTTP 404 response."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc), "code": "CONVERSATION_NOT_FOUND"},
    )


async def unauthorized_handler(request: Request, exc: UnauthorizedError) -> JSONResponse:
    """Handle UnauthorizedError and return HTTP 401 response."""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc), "code": "UNAUTHORIZED"},
    )


async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle ValidationError and return HTTP 422 response."""
    content = {"detail": str(exc), "code": "VALIDATION_ERROR"}
    if exc.field:
        content["field"] = exc.field
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=content,
    )
