"""Business logic layer for Tag management, normalization, orphan cleanup, and statistics."""
from sqlmodel import Session
from typing import List, Dict, Any

from src.models.tag import Tag
from src.schemas.task import TagListResponse, TagRead
from src.exceptions.base import TagNotFoundError
from src.repositories.tag_repo import TagRepository
from src.repositories.task_repo import TaskRepository


class TagService:
    """Service class encapsulating business rules and workflows for tags."""

    def __init__(self, tag_repo: TagRepository, task_repo: TaskRepository) -> None:
        """Initialize TagService with repository dependencies.

        Args:
            tag_repo (TagRepository): Data access repository for tags.
            task_repo (TaskRepository): Data access repository for tasks.
        """
        self._tag_repo = tag_repo
        self._task_repo = task_repo

    def get_or_create(self, session: Session, tag_name: str, user_id: str) -> Tag:
        """Fetch an existing tag or insert a new lowercased tag for a user.

        Args:
            session (Session): Active database session transaction.
            tag_name (str): Raw input tag name string (will be trimmed and lowercased).
            user_id (str): Authenticated user ID owning the tag.

        Returns:
            Tag: Matched existing or newly created Tag model instance.
        """
        normalized_name = tag_name.lower().strip()
        tag = self._tag_repo.find_by_name(session, normalized_name, user_id)
        if not tag:
            tag = Tag(user_id=user_id, name=normalized_name)
            self._tag_repo.insert_tag(session, tag)
        return tag

    def get_tag_by_id(self, session: Session, tag_id: str, user_id: str) -> Tag:
        """Retrieve a specific tag by ID ensuring user ownership security.

        Args:
            session (Session): Active database session.
            tag_id (str): Unique UUID string of the tag.
            user_id (str): ID of the authenticated user requesting the tag.

        Returns:
            Tag: Matched Tag instance if found.

        Raises:
            TagNotFoundError: If tag does not exist or belongs to another user.
        """
        tag = self._tag_repo.find_by_id(session, tag_id, user_id)
        if not tag:
            raise TagNotFoundError(tag_id)
        return tag

    def list_tags(self, session: Session, user_id: str) -> List[Tag]:
        """List all tag models owned by a specific user ordered alphabetically.

        Args:
            session (Session): Active database session.
            user_id (str): ID of the authenticated user.

        Returns:
            List[Tag]: Alphabetically ordered list of Tag instances.
        """
        return self._tag_repo.find_all(session, user_id)

    def get_tags_for_task(self, session: Session, task_id: str, user_id: str) -> List[Tag]:
        """Get all tags attached to a specific task after validating user ownership.

        Args:
            session (Session): Active database session.
            task_id (str): Unique UUID string of the task.
            user_id (str): ID of the authenticated user.

        Returns:
            List[Tag]: List of Tag instances associated with the task.

        Raises:
            TagNotFoundError: If the task is not found or unauthorized.
        """
        task = self._task_repo.find_by_id(session, task_id, user_id)
        if not task:
            raise TagNotFoundError(f"Task {task_id} not found for user {user_id}")
        return self._tag_repo.find_for_task(session, task_id)

    def get_tag_stats(self, session: Session, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve statistics for user's tags including task counts.

        Args:
            session (Session): Active database session.
            user_id (str): ID of the authenticated user.

        Returns:
            List[Dict[str, Any]]: List of dictionary stats with 'id', 'name', and 'task_count'.
        """
        return self._tag_repo.get_stats(session, user_id)

    def get_tag_list_response(self, session: Session, user_id: str) -> TagListResponse:
        """Construct the TagListResponse schema containing stats for all user tags.

        Args:
            session (Session): Active database session.
            user_id (str): ID of the authenticated user.

        Returns:
            TagListResponse: Serialized schema payload containing list of tag items.
        """
        stats = self.get_tag_stats(session, user_id)
        items = [
            TagRead(id=stat["id"], name=stat["name"], task_count=stat["task_count"])
            for stat in stats
        ]
        return TagListResponse(tags=items)

    def cleanup_orphan_tags(self, session: Session, user_id: str) -> int:
        """Delete orphan tags (tags without linked tasks) for a user.

        Args:
            session (Session): Active database session transaction.
            user_id (str): ID of the authenticated user.

        Returns:
            int: Number of deleted orphan tags.
        """
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
