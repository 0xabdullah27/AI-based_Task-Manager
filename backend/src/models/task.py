"""Task database model definition for SQLModel / SQLAlchemy ORM.

This module defines the database representation of a user task item,
including priority levels, completion status, timestamps, and tag relationships.
"""
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Boolean, Integer, Enum as SQLEnum, ForeignKey
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from src.models.priority import Priority
from src.models.tag import TaskTag
from src.utils.helpers import utc_now, generate_uuid

if TYPE_CHECKING:
    from src.models.tag import Tag


class Task(SQLModel, table=True):
    """Database model representing a task (todo item) owned by a user.

    Attributes:
        id (str): Unique UUID identifier for the task (primary key).
        user_id (str): Foreign key linking the task to a specific user account.
        title (str): Concise title/heading of the task (1-200 characters).
        description (Optional[str]): Detailed task description or notes (up to 2000 characters).
        completed (bool): Flag indicating whether the task is finished (default False).
        priority (Priority): Priority level enum (LOW, MEDIUM, HIGH).
        parent_id (Optional[str]): Foreign key to the parent task (NULL for root tasks).
        position (Optional[int]): Step ordering index among sibling subtasks (NULL for root tasks).
        created_at (datetime): UTC timestamp when the task was created.
        updated_at (Optional[datetime]): UTC timestamp when the task was last modified.
        tags (List[Tag]): Many-to-many relationship with Tag model via TaskTag link table.
        subtasks (List[Task]): Child tasks ordered by position (one nesting level only).
    """

    __tablename__ = "task"

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
        default=Priority.LOW,
        sa_column=Column(
            SQLEnum(Priority, native_enum=False, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
            index=True,
            server_default="low"
        )
    )

    parent_id: Optional[str] = Field(
        default=None,
        sa_column=Column(
            String(36),
            ForeignKey("task.id", ondelete="CASCADE"),
            nullable=True,
            index=True,
        ),
    )

    position: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, nullable=True, index=True),
    )

    created_at: datetime = Field(default_factory=utc_now, index=True)
    updated_at: Optional[datetime] = Field(default_factory=utc_now)

    tags: List["Tag"] = Relationship(
        back_populates="tasks",
        link_model=TaskTag
    )

    subtasks: List["Task"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "Task.position",
        },
    )

    parent: Optional["Task"] = Relationship(
        back_populates="subtasks",
        sa_relationship_kwargs={"remote_side": "Task.id"},
    )
