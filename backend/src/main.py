"""FastAPI application entry point."""

from contextlib import asynccontextmanager, AsyncExitStack

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware # to cpmpress the lar

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.middleware.cors import configure_cors
from src.middleware.logging import logging_middleware
from src.middleware.error_handler import error_handler_middleware
from src.middleware.rate_limit import limiter

from src.core.config import settings
from src.core.database import create_db_and_tables


from src.routers import health, tasks, tags, chat

from src.exceptions.base import TaskNotFoundError, UnauthorizedError, ValidationError
from src.exceptions.handlers import (
    task_not_found_handler,
    unauthorized_handler,
    validation_error_handler,
)

import logging

from mcp_server.server import mcp_app
from mcp_server.server import mcp

# Configure logging
# DEBUG
# INFO
# WARNING
# ERROR
# CRITICAL
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown logic."""
    async with AsyncExitStack() as stack:
        await stack.enter_async_context(mcp.session_manager.run())
        # yield
        logger.info("Starting up Todo Backend API...")
        create_db_and_tables()
        logger.info("Database tables created/verified")

        # start MCP runtime
        # await mcp.run()

        yield

        logger.info("Shutting down Todo Backend API...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Attach rate limiter state
app.state.limiter = limiter

# Configure middleware (order matters: first added = outermost layer)
app.middleware("http")(logging_middleware)  # 1. Log + X-Process-Time
app.middleware("http")(error_handler_middleware)  # 2. Handle errors
configure_cors(app)  # 3. CORS
# app.add_middleware(GZipMiddleware, minimum_size=500)  # 4. Compress responses


# Register exception handlers
app.add_exception_handler(TaskNotFoundError, task_not_found_handler)
app.add_exception_handler(UnauthorizedError, unauthorized_handler)
app.add_exception_handler(ValidationError, validation_error_handler)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Register routers
app.include_router(health.router)
app.include_router(tasks.router)
app.include_router(tags.router)
app.include_router(chat.router)

# Mount MCP server at /mcp (same deployment — no separate MCP host needed)

app.mount("/mcp", mcp_app)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Todo Backend API", "docs": "/docs", "health": "/health"}
