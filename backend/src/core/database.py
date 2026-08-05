"""Database connection and session management."""
from sqlmodel import create_engine, Session, SQLModel
from typing import Generator
import logging

# Import all models so SQLModel knows about them when creating tables
from src.models.user import User  # noqa: F401
from src.models.task import Task  # noqa: F401
from src.models.tag import Tag, TaskTag  # noqa: F401
from src.models.conversation import Conversation  # noqa: F401
from src.models.message import Message  # noqa: F401
from src.core.config import settings

logger = logging.getLogger(__name__)

# Determine connect_args based on database type
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif settings.database_url.startswith("postgresql"):
    connect_args = {"connect_timeout": 10}

# Create engine with pool settings
engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
)


def create_db_and_tables():
    """Create all database tables."""
    try:
        logger.info("Creating database tables...")
        SQLModel.metadata.create_all(engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session
