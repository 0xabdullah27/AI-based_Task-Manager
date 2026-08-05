"""Message model for chat history."""
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Text
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from src.utils.helpers import utc_now, generate_uuid

if TYPE_CHECKING:
    from src.models.conversation import Conversation


class Message(SQLModel, table=True):
    """Message model for chat history.

    Per spec: user_id, id, conversation_id, role (user/assistant), content, created_at
    """

    id: str = Field(default_factory=generate_uuid, primary_key=True)
    conversation_id: str = Field(foreign_key="conversation.id", index=True)
    user_id: str = Field(index=True)

    role: str = Field(
        sa_column=Column(String(20), nullable=False)
    )  # "user" or "assistant"

    content: str = Field(
        sa_column=Column(Text, nullable=False)
    )

    created_at: datetime = Field(default_factory=utc_now, index=True)

    # Relationship back to conversation
    conversation: Optional["Conversation"] = Relationship(back_populates="messages")
