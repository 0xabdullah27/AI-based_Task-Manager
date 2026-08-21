"""Database models for tags and task-tag relationship mappings."""
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String
from datetime import datetime
from typing import List, TYPE_CHECKING

from src.utils.helpers import utc_now, generate_uuid

if TYPE_CHECKING:
    from src.models.task import Task


class TaskTag(SQLModel, table=True):
    """Junction database model for the Task-Tag many-to-many relationship.

    Attributes:
        task_id (str): Foreign key referencing task.id.
        tag_id (str): Foreign key referencing tag.id.
    """

    __tablename__ = "task_tag"

    task_id: str = Field(foreign_key="task.id", primary_key=True, description="Foreign key linking to Task primary key UUID")
    tag_id: str = Field(foreign_key="tag.id", primary_key=True, description="Foreign key linking to Tag primary key UUID")


class Tag(SQLModel, table=True):
    """Tag database model for task categorization.

    Unique per user and stored in lowercase format.

    Attributes:
        id (str): Primary key UUID string.
        user_id (str): Foreign key linking to user owner.
        name (str): Case-insensitive unique tag name string (max 50 chars).
        created_at (datetime): UTC creation timestamp.
        tasks (List[Task]): Many-to-many relationship list back to tasks via TaskTag.
    """

    id: str = Field(default_factory=generate_uuid, primary_key=True, description="Unique UUID primary key string")
    user_id: str = Field(foreign_key="user.id", index=True, description="Foreign key identifying tag owner")
    name: str = Field(
        sa_column=Column(String(50), nullable=False, index=True),
        description="Tag name string (lowercased, indexed)",
    )
    created_at: datetime = Field(default_factory=utc_now, description="UTC creation timestamp")

    tasks: List["Task"] = Relationship(
        back_populates="tags",
        link_model=TaskTag,
    )
