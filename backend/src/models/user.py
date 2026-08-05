"""User model - read-only reference to Better Auth user table.

This model is NOT managed by this application.
Better Auth creates and manages the user table.
We reference it only for foreign key relationships.
"""
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String, Boolean
from datetime import datetime

from src.utils.helpers import utc_now


class User(SQLModel, table=True):
    """User model - managed by Better Auth."""

    id: str = Field(primary_key=True)
    email: str = Field(
        sa_column=Column(String(255), unique=True, index=True, nullable=False)
    )
    name: str = Field(
        sa_column=Column(String(100), nullable=False)
    )
    emailVerified: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, server_default="false")
    )
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)
