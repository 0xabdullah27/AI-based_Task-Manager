"""Tag models for task categorization."""
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String
from datetime import datetime
from typing import List, TYPE_CHECKING

from src.utils.helpers import utc_now, generate_uuid

if TYPE_CHECKING:
    from src.models.task import Task


class TaskTag(SQLModel, table=True):
    """Junction table for Task-Tag many-to-many relationship.

    NOTE: This must be defined BEFORE Tag and Task models to be used in link_model.
    """
    __tablename__ = "task_tag"

    task_id: str = Field(foreign_key="task.id", primary_key=True)
    tag_id: str = Field(foreign_key="tag.id", primary_key=True)


class Tag(SQLModel, table=True):
    """Tag for categorizing tasks - unique per user, case-insensitive.

    Tags are stored lowercase and must be unique per user.
    """

    id: str = Field(default_factory=generate_uuid, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    name: str = Field(
        sa_column=Column(String(50), nullable=False, index=True)
    )
    created_at: datetime = Field(default_factory=utc_now)

    tasks: List["Task"] = Relationship(
        back_populates="tags",
        link_model=TaskTag
    )
