"""Business logic layer for Task operations."""
from sqlmodel import Session
from typing import List, Optional

from src.models.task import Task
from src.schemas.task import TaskCreate, TaskUpdate
from src.exceptions.base import TaskNotFoundError
from src.repositories.task_repo import TaskRepository
from src.repositories.tag_repo import TagRepository
from src.utils.helpers import utc_now


class TaskService:
    """Service for Task business logic."""

    def __init__(self, task_repo: TaskRepository, tag_repo: TagRepository, tag_service):
        self._task_repo = task_repo
        self._tag_repo = tag_repo
        self._tag_service = tag_service

    def create_task(self, session: Session, task_data: TaskCreate, user_id: str) -> Task:
        """Create a new task with optional tags."""
        task = Task(
            user_id=user_id,
            title=task_data.title,
            description=task_data.description,
            completed=task_data.completed,
            priority=task_data.priority,
        )
        self._task_repo.insert_task(session, task)

        if task_data.tags:
            for tag_name in task_data.tags:
                tag = self._tag_service.get_or_create(session, tag_name, user_id)
                self._task_repo.link_task_tag(session, task.id, tag.id)

        session.commit()
        session.refresh(task)
        return task

    def get_task(self, session: Session, task_id: str, user_id: str) -> Task:
        """Get a task by ID, ensuring it belongs to the user."""
        task = self._task_repo.find_by_id(session, task_id, user_id)
        if not task:
            raise TaskNotFoundError(task_id)
        return task

    def get_task_with_tags(self, session: Session, task_id: str, user_id: str) -> Task:
        """Get a task by ID with eager-loaded tags."""
        task = self._task_repo.find_by_id_with_tags(session, task_id, user_id)
        if not task:
            raise TaskNotFoundError(task_id)
        return task

    def list_tasks(
        self,
        session: Session,
        user_id: str,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        tags: Optional[list] = None,
        no_tags: bool = False,
        sort_field: str = "priority",
        sort_order: str = "asc",
        offset: int = 0,
        limit: int = 100,
    ) -> List[Task]:
        """List tasks with filtering, searching, sorting, and pagination."""
        limit = min(limit, 100)
        return self._task_repo.find_all(
            session,
            user_id=user_id,
            search=search,
            status=status,
            priority=priority,
            tags=tags,
            no_tags=no_tags,
            sort_field=sort_field,
            sort_order=sort_order,
            offset=offset,
            limit=limit,
        )

    def update_task(
        self, session: Session, task_id: str, task_data: TaskUpdate, user_id: str
    ) -> Task:
        """Update a task's fields and/or tags."""
        task = self.get_task(session, task_id, user_id)

        if task_data.title is not None:
            task.title = task_data.title
        if task_data.description is not None:
            task.description = task_data.description
        if task_data.completed is not None:
            task.completed = task_data.completed
        if task_data.priority is not None:
            task.priority = task_data.priority

        if task_data.tags is not None:
            self._task_repo.delete_task_tags(session, task.id)
            for tag_name in task_data.tags:
                tag = self._tag_service.get_or_create(session, tag_name, user_id)
                self._task_repo.link_task_tag(session, task.id, tag.id)

        task.updated_at = utc_now()
        session.add(task)
        session.commit()
        session.refresh(task)
        return task

    def delete_task(self, session: Session, task_id: str, user_id: str) -> None:
        """Delete a task."""
        task = self.get_task(session, task_id, user_id)
        self._task_repo.delete(session, task)
        session.commit()

    def toggle_task_completion(self, session: Session, task_id: str, user_id: str) -> Task:
        """Toggle task completion status."""
        task = self.get_task(session, task_id, user_id)
        task.completed = not task.completed
        task.updated_at = utc_now()
        session.add(task)
        session.commit()
        session.refresh(task)
        return task


# Module-level instance wiring
from src.repositories.task_repo import task_repo  # noqa: E402
from src.repositories.tag_repo import tag_repo  # noqa: E402
from src.services.tag_service import tag_service  # noqa: E402

task_service = TaskService(task_repo, tag_repo, tag_service)
