"""Data access repository layer for Tag model queries and database operations.

Contains pure SQLModel/SQLAlchemy database queries without higher-level business logic.
"""
from sqlmodel import Session, select
from sqlalchemy import func, exists
from typing import List, Optional, Dict, Any

from src.models.tag import Tag, TaskTag


class TagRepository:
    """Repository class encapsulating database operations for Tag records."""

    def find_by_name(self, session: Session, name: str, user_id: str) -> Optional[Tag]:
        """Find a tag record by name scoped to a specific user.

        Args:
            session (Session): Active database session.
            name (str): Lowercased tag name string.
            user_id (str): ID of the user owning the tag.

        Returns:
            Optional[Tag]: Matched Tag model instance, or None if not found.
        """
        statement = select(Tag).where(Tag.user_id == user_id, Tag.name == name)
        return session.exec(statement).first()

    def find_by_id(self, session: Session, tag_id: str, user_id: str) -> Optional[Tag]:
        """Find a tag record by ID scoped to a specific user.

        Args:
            session (Session): Active database session.
            tag_id (str): Unique UUID string of the tag.
            user_id (str): ID of the user owning the tag.

        Returns:
            Optional[Tag]: Matched Tag model instance, or None if not found.
        """
        statement = select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
        return session.exec(statement).first()

    def insert_tag(self, session: Session, tag: Tag) -> Tag:
        """Insert a new Tag record into the database session.

        Args:
            session (Session): Active database session.
            tag (Tag): Tag model instance to insert.

        Returns:
            Tag: Inserted Tag instance with flushed defaults.
        """
        session.add(tag)
        session.flush()
        return tag

    def find_all(self, session: Session, user_id: str) -> List[Tag]:
        """List all tag records for a specific user ordered alphabetically by name.

        Args:
            session (Session): Active database session.
            user_id (str): ID of the authenticated user.

        Returns:
            List[Tag]: List of Tag instances sorted by name ascending.
        """
        statement = select(Tag).where(Tag.user_id == user_id).order_by(Tag.name.asc())
        return list(session.exec(statement).all())

    def find_for_task(self, session: Session, task_id: str) -> List[Tag]:
        """Fetch all tag records linked to a specific task ID via TaskTag junction.

        Args:
            session (Session): Active database session.
            task_id (str): Unique UUID string of the task.

        Returns:
            List[Tag]: List of associated Tag instances ordered by name.
        """
        statement = (
            select(Tag)
            .join(TaskTag, TaskTag.tag_id == Tag.id)
            .where(TaskTag.task_id == task_id)
            .order_by(Tag.name.asc())
        )
        return list(session.exec(statement).all())

    def get_stats(self, session: Session, user_id: str) -> List[Dict[str, Any]]:
        """Compute task count statistics for each tag owned by a user.

        Args:
            session (Session): Active database session.
            user_id (str): ID of the authenticated user.

        Returns:
            List[Dict[str, Any]]: List of dict objects containing 'id', 'name', and 'task_count'.
        """
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
        """Find all tag records for a user that currently have no linked tasks.

        Args:
            session (Session): Active database session.
            user_id (str): ID of the authenticated user.

        Returns:
            List[Tag]: List of unlinked/orphan Tag instances.
        """
        statement = (
            select(Tag)
            .where(Tag.user_id == user_id)
            .where(~exists().where(TaskTag.tag_id == Tag.id))
        )
        return list(session.exec(statement).all())

    def delete(self, session: Session, tag: Tag) -> None:
        """Delete a Tag record from the database session.

        Args:
            session (Session): Active database session transaction.
            tag (Tag): Tag model instance to delete.
        """
        session.delete(tag)


tag_repo = TagRepository()
