"""Database model for user AI chat conversations."""
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from src.utils.helpers import utc_now, generate_uuid

if TYPE_CHECKING:
    from src.models.message import Message


class Conversation(SQLModel, table=True):
    """Conversation database model for tracking user chat sessions.

    Attributes:
        id (str): Primary key UUID string identifying the chat session.
        user_id (str): Foreign key linking to user owner.
        created_at (datetime): UTC timestamp when conversation was initiated.
        updated_at (Optional[datetime]): UTC timestamp of last conversation update.
        messages (List[Message]): One-to-many relationship list of messages in history.
    """

    id: str = Field(default_factory=generate_uuid, primary_key=True, description="Unique conversation UUID string")
    user_id: str = Field(foreign_key="user.id", index=True, description="Foreign key linking to owner User ID")

    created_at: datetime = Field(default_factory=utc_now, index=True, description="UTC creation timestamp")
    updated_at: Optional[datetime] = Field(default_factory=utc_now, description="UTC last updated timestamp")

    messages: List["Message"] = Relationship(back_populates="conversation")
