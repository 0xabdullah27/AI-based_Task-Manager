"""Shared utility functions used across models and services."""
from datetime import datetime, UTC
import uuid


def utc_now() -> datetime:
    """Get current UTC time."""
    return datetime.now(UTC)


def generate_uuid() -> str:
    """Generate UUID string."""
    return str(uuid.uuid4())
