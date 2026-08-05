"""Conversation model for chat sessions."""

from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from src.utils.helpers import utc_now, generate_uuid

if TYPE_CHECKING:
    from src.models.message import Message


class Conversation(SQLModel, table=True):
    """Conversation model for user chat sessions.

    Per spec: user_id, id, created_at, updated_at
    """

    id: str = Field(default_factory=generate_uuid, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)

    created_at: datetime = Field(default_factory=utc_now, index=True)
    updated_at: Optional[datetime] = Field(default_factory=utc_now)

    # Relationship to messages
    messages: List["Message"] = Relationship(back_populates="conversation")
