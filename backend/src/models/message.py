"""Database model for chat message history in AI conversations."""
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Text
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from src.utils.helpers import utc_now, generate_uuid

if TYPE_CHECKING:
    from src.models.conversation import Conversation


class Message(SQLModel, table=True):
    """Message database model representing individual entries in a conversation.

    Attributes:
        id (str): Primary key UUID string of the message.
        conversation_id (str): Foreign key linking to parent conversation.id.
        user_id (str): ID of the user who owns the parent conversation.
        role (str): Message author role ('user' or 'assistant').
        content (str): Text content of the message.
        created_at (datetime): UTC creation timestamp.
        conversation (Optional[Conversation]): Relationship back to parent Conversation.
    """

    id: str = Field(default_factory=generate_uuid, primary_key=True, description="Unique message UUID string")
    conversation_id: str = Field(foreign_key="conversation.id", index=True, description="Foreign key linking to Conversation")
    user_id: str = Field(index=True, description="User ID for ownership scoping")

    role: str = Field(
        sa_column=Column(String(20), nullable=False),
        description="Message author role ('user' or 'assistant')",
    )

    content: str = Field(
        sa_column=Column(Text, nullable=False),
        description="Text content of the message",
    )

    created_at: datetime = Field(default_factory=utc_now, index=True, description="UTC creation timestamp")

    conversation: Optional["Conversation"] = Relationship(back_populates="messages")
