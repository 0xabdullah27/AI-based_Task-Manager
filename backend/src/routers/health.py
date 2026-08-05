"""Health check endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import text

from src.api.deps import DbSession


router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    service: str


class DbHealthResponse(BaseModel):
    status: str
    database: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify service is running."""
    return HealthResponse(status="ok", service="todo-backend")


@router.get("/health/db", response_model=DbHealthResponse)
async def db_health_check(session: DbSession):
    """Database connectivity check."""
    try:
        session.exec(text("SELECT 1"))
        return DbHealthResponse(status="ok", database="connected")
    except Exception:
        return DbHealthResponse(status="error", database="disconnected")
