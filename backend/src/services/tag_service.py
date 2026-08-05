"""Business logic layer for Tag operations."""
from sqlmodel import Session
from typing import List

from src.models.tag import Tag
from src.exceptions.base import TagNotFoundError
from src.repositories.tag_repo import TagRepository
from src.repositories.task_repo import TaskRepository


class TagService:
    """Service for Tag business logic."""

    def __init__(self, tag_repo: TagRepository, task_repo: TaskRepository):
        self._tag_repo = tag_repo
        self._task_repo = task_repo

    def get_or_create(self, session: Session, tag_name: str, user_id: str) -> Tag:
        """Get an existing tag or create a new one (case-insensitive)."""
        tag_name = tag_name.lower().strip()
        tag = self._tag_repo.find_by_name(session, tag_name, user_id)
        if not tag:
            tag = Tag(user_id=user_id, name=tag_name)
            self._tag_repo.insert_tag(session, tag)
        return tag

    def get_tag_by_id(self, session: Session, tag_id: str, user_id: str) -> Tag:
        """Get a tag by ID, ensuring it belongs to the user."""
        tag = self._tag_repo.find_by_id(session, tag_id, user_id)
        if not tag:
            raise TagNotFoundError(tag_id)
        return tag

    def list_tags(self, session: Session, user_id: str) -> List[Tag]:
        """List all tags for a user."""
        return self._tag_repo.find_all(session, user_id)

    def get_tags_for_task(self, session: Session, task_id: str, user_id: str) -> List[Tag]:
        """Get all tags associated with a task."""
        task = self._task_repo.find_by_id(session, task_id, user_id)
        if not task:
            raise TagNotFoundError(f"Task {task_id} not found for user {user_id}")
        return self._tag_repo.find_for_task(session, task_id)

    def get_tag_stats(self, session: Session, user_id: str) -> List[dict]:
        """Get tag statistics with task counts."""
        return self._tag_repo.get_stats(session, user_id)

    def cleanup_orphan_tags(self, session: Session, user_id: str) -> int:
        """Clean up orphan tags (tags with no associated tasks)."""
        orphans = self._tag_repo.find_orphans(session, user_id)
        for tag in orphans:
            self._tag_repo.delete(session, tag)
        if orphans:
            session.commit()
        return len(orphans)


# Module-level instance wiring
from src.repositories.tag_repo import tag_repo  # noqa: E402
from src.repositories.task_repo import task_repo  # noqa: E402

tag_service = TagService(tag_repo, task_repo)
