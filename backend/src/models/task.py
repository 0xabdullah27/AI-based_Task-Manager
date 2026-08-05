"""Task model for todo items."""
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Boolean, Enum as SQLEnum
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from src.models.priority import Priority
from src.models.tag import TaskTag
from src.utils.helpers import utc_now, generate_uuid

if TYPE_CHECKING:
    from src.models.tag import Tag


class Task(SQLModel, table=True):
    """Task model for user todo items.

    Extended with priority field (enum) and tags relationship (many-to-many).
    """

    id: str = Field(default_factory=generate_uuid, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)

    title: str = Field(
        sa_column=Column(String(200), nullable=False)
    )
    description: Optional[str] = Field(
        default=None,
        sa_column=Column(String(2000), nullable=True)
    )

    completed: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, server_default="false")
    )

    priority: Priority = Field(
        default=Priority.NONE,
        sa_column=Column(
            SQLEnum(Priority, native_enum=False, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
            index=True,
            server_default="none"
        )
    )

    created_at: datetime = Field(default_factory=utc_now, index=True)
    updated_at: Optional[datetime] = Field(default_factory=utc_now)

    tags: List["Tag"] = Relationship(
        back_populates="tasks",
        link_model=TaskTag
    )
