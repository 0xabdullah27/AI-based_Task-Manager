"""FastAPI application entry point - v1.0.1"""

from contextlib import asynccontextmanager, AsyncExitStack
import logging

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.middleware.cors import configure_cors
from src.middleware.logging import logging_middleware
from src.middleware.error_handler import error_handler_middleware
from src.middleware.rate_limit import limiter, rate_limit_exceeded_handler

from src.core.config import settings

from src.routers import health, tasks, tags, chat, settings as settings_router

from src.exceptions.base import (
    TaskNotFoundError,
    TagNotFoundError,
    ConversationNotFoundError,
    UnauthorizedError,
    ValidationError,
)
from src.exceptions.handlers import (
    task_not_found_handler,
    tag_not_found_handler,
    conversation_not_found_handler,
    unauthorized_handler,
    validation_error_handler,
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown logic."""
    async with AsyncExitStack():
        logger.info("Starting up Todo Backend API...")
        try:
            from run_migrations import main as run_migrations
            run_migrations()
        except Exception as e:
            logger.warning("Automatic migration check failed: %s", e)
        yield
        logger.info("Shutting down Todo Backend API...")


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter

app.middleware("http")(logging_middleware)
app.middleware("http")(error_handler_middleware)
configure_cors(app)

app.add_exception_handler(TaskNotFoundError, task_not_found_handler)
app.add_exception_handler(TagNotFoundError, tag_not_found_handler)
app.add_exception_handler(ConversationNotFoundError, conversation_not_found_handler)
app.add_exception_handler(UnauthorizedError, unauthorized_handler)
app.add_exception_handler(ValidationError, validation_error_handler)
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.include_router(health.router)
app.include_router(tasks.router)
app.include_router(tags.router)
app.include_router(chat.router)
app.include_router(settings_router.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Todo Backend API", "docs": "/docs", "health": "/health"}
