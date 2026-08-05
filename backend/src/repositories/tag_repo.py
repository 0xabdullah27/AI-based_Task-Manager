"""Data access layer for Tag model — pure SQL queries, no business logic."""
from sqlmodel import Session, select
from sqlalchemy import func, exists
from typing import List, Optional

from src.models.tag import Tag, TaskTag
from src.models.task import Task


class TagRepository:
    """Repository for Tag data access operations."""

    def find_by_name(self, session: Session, name: str, user_id: str) -> Optional[Tag]:
        """Find a tag by name scoped to user."""
        statement = select(Tag).where(Tag.user_id == user_id, Tag.name == name)
        return session.exec(statement).first()

    def find_by_id(self, session: Session, tag_id: str, user_id: str) -> Optional[Tag]:
        """Find a tag by ID scoped to user."""
        statement = select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
        return session.exec(statement).first()

    def insert_tag(self, session: Session, tag: Tag) -> Tag:
        """Insert a tag into the database."""
        session.add(tag)
        session.flush()
        return tag

    def find_all(self, session: Session, user_id: str) -> List[Tag]:
        """List all tags for a user ordered by name."""
        statement = select(Tag).where(Tag.user_id == user_id).order_by(Tag.name.asc())
        return list(session.exec(statement).all())

    def find_for_task(self, session: Session, task_id: str) -> List[Tag]:
        """Get tags associated with a task."""
        statement = (
            select(Tag)
            .join(TaskTag, TaskTag.tag_id == Tag.id)
            .where(TaskTag.task_id == task_id)
            .order_by(Tag.name.asc())
        )
        return list(session.exec(statement).all())

    def get_stats(self, session: Session, user_id: str) -> List[dict]:
        """Get tag statistics with task counts."""
        statement = (
            select(Tag.id, Tag.name, func.count(TaskTag.task_id).label("task_count"))
            .outerjoin(TaskTag, TaskTag.tag_id == Tag.id)
            .where(Tag.user_id == user_id)
            .group_by(Tag.id, Tag.name)
            .order_by(Tag.name.asc())
        )
        return [
            {"id": r.id, "name": r.name, "task_count": r.task_count}
            for r in session.exec(statement).all()
        ]

    def find_orphans(self, session: Session, user_id: str) -> List[Tag]:
        """Find tags with no associated tasks."""
        statement = (
            select(Tag)
            .where(Tag.user_id == user_id)
            .where(~exists().where(TaskTag.tag_id == Tag.id))
        )
        return list(session.exec(statement).all())

    def delete(self, session: Session, tag: Tag) -> None:
        """Delete a tag from the database."""
        session.delete(tag)


tag_repo = TagRepository()
