"""Business logic layer for Task operations, validation, tag management, and orchestration."""
from sqlmodel import Session
from typing import List, Optional, Union, TYPE_CHECKING

from src.models.task import Task
from src.schemas.task import TaskCreate, TaskUpdate, TaskListResponse, StatusFilter, PriorityFilter, SortField, SortOrder
from src.exceptions.base import TaskNotFoundError
from src.repositories.task_repo import TaskRepository
from src.repositories.tag_repo import TagRepository
from src.utils.helpers import utc_now

if TYPE_CHECKING:
    from src.services.tag_service import TagService


class TaskService:
    """Service class handling business rules and orchestration for task operations."""

    def __init__(self, task_repo: TaskRepository, tag_repo: TagRepository, tag_service: "TagService") -> None:
        """Initialize TaskService with repository and dependent service dependencies.

        Args:
            task_repo (TaskRepository): Repository instance for task data access.
            tag_repo (TagRepository): Repository instance for tag data access.
            tag_service (TagService): Service instance for tag creation and resolution logic.
        """
        self._task_repo = task_repo
        self._tag_repo = tag_repo
        self._tag_service = tag_service

    def create_task(self, session: Session, task_data: TaskCreate, user_id: str) -> Task:
        """Create a new task for a user and link optional tags.

        Args:
            session (Session): Active database session transaction.
            task_data (TaskCreate): Validated Pydantic request schema containing task fields and tags.
            user_id (str): ID of the authenticated user creating the task.

        Returns:
            Task: Created Task model instance with populated IDs and committed database state.
        """
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
        """Retrieve a task by ID ensuring it belongs to the specified user.

        Args:
            session (Session): Active database session.
            task_id (str): Unique UUID string of the task to retrieve.
            user_id (str): ID of the authenticated user requesting the task.

        Returns:
            Task: Task model instance if found.

        Raises:
            TaskNotFoundError: If no task with task_id exists or if it belongs to another user.
        """
        task = self._task_repo.find_by_id(session, task_id, user_id)
        if not task:
            raise TaskNotFoundError(task_id)
        return task

    def get_task_with_tags(self, session: Session, task_id: str, user_id: str) -> Task:
        """Retrieve a task by ID with eager-loaded tags, enforcing user isolation.

        Args:
            session (Session): Active database session.
            task_id (str): Unique UUID string of the task.
            user_id (str): ID of the authenticated user requesting the task.

        Returns:
            Task: Task model instance with populated tags relationship list.

        Raises:
            TaskNotFoundError: If no task matching task_id and user_id is found.
        """
        task = self._task_repo.find_by_id_with_tags(session, task_id, user_id)
        if not task:
            raise TaskNotFoundError(task_id)
        return task

    def list_tasks(
        self,
        session: Session,
        user_id: str,
        search: Optional[str] = None,
        status: Optional[Union[StatusFilter, str]] = None,
        priority: Optional[Union[PriorityFilter, str]] = None,
        tags: Optional[List[str]] = None,
        no_tags: bool = False,
        sort_field: Union[SortField, str] = "priority",
        sort_order: Union[SortOrder, str] = "asc",
        offset: int = 0,
        limit: int = 100,
    ) -> List[Task]:
        """Fetch a list of tasks owned by a user with filtering, searching, sorting, and pagination.

        Args:
            session (Session): Active database session.
            user_id (str): Authenticated user ID for data isolation.
            search (Optional[str]): Case-insensitive search text for title and description. Defaults to None.
            status (Optional[Union[StatusFilter, str]]): Completion status filter ('all', 'pending', 'completed'). Defaults to None.
            priority (Optional[Union[PriorityFilter, str]]): Priority filter ('all', 'high', 'medium', 'low', 'none'). Defaults to None.
            tags (Optional[List[str]]): List of tag strings to filter tasks. Defaults to None.
            no_tags (bool): Flag to select tasks without tags. Defaults to False.
            sort_field (Union[SortField, str]): Field to sort by ('priority', 'title', 'created_at'). Defaults to "priority".
            sort_order (Union[SortOrder, str]): Sort direction ('asc', 'desc'). Defaults to "asc".
            offset (int): Pagination offset index (>= 0). Defaults to 0.
            limit (int): Pagination limit (max 100). Defaults to 100.

        Returns:
            List[Task]: List of Task instances matching all filter criteria.
        """
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

    def get_tasks_with_counts(
        self,
        session: Session,
        user_id: str,
        search: Optional[str] = None,
        status: Optional[Union[StatusFilter, str]] = None,
        priority: Optional[Union[PriorityFilter, str]] = None,
        tags: Optional[List[str]] = None,
        no_tags: bool = False,
        sort_field: Union[SortField, str] = "priority",
        sort_order: Optional[Union[SortOrder, str]] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> TaskListResponse:
        """Fetch tasks along with total user task count and count of tasks matching filter parameters.

        Args:
            session (Session): Active database session.
            user_id (str): Authenticated user ID.
            search (Optional[str]): Keyword search filter.
            status (Optional[Union[StatusFilter, str]]): Completion status filter.
            priority (Optional[Union[PriorityFilter, str]]): Priority level filter.
            tags (Optional[List[str]]): Tag names filter list.
            no_tags (bool): Flag for untagged tasks filter.
            sort_field (Union[SortField, str]): Primary sort field.
            sort_order (Optional[Union[SortOrder, str]]): Sort order direction. Defaults depending on sort field.
            offset (int): Pagination offset.
            limit (int): Pagination limit (capped at 100).

        Returns:
            TaskListResponse: Wrapped response containing matched tasks list, total user count, and filtered count.
        """
        if isinstance(sort_field, SortField):
            sort_field_val = sort_field.value
        else:
            sort_field_val = sort_field or "priority"

        if sort_order:
            effective_order = sort_order.value if isinstance(sort_order, SortOrder) else sort_order
        else:
            effective_order = "desc" if sort_field_val == "created_at" else "asc"

        status_val = status.value if isinstance(status, StatusFilter) else status
        priority_val = priority.value if isinstance(priority, PriorityFilter) else priority

        tasks = self.list_tasks(
            session=session,
            user_id=user_id,
            search=search,
            status=status_val,
            priority=priority_val,
            tags=tags,
            no_tags=no_tags,
            sort_field=sort_field_val,
            sort_order=effective_order,
            offset=offset,
            limit=limit,
        )

        total = self._task_repo.count_total(session, user_id)
        filtered = self._task_repo.count_filtered(
            session=session,
            user_id=user_id,
            search=search,
            status=status_val,
            priority=priority_val,
            tags=tags,
            no_tags=no_tags,
        )

        return TaskListResponse(tasks=tasks, total=total, filtered=filtered)

    def update_task(
        self, session: Session, task_id: str, task_data: TaskUpdate, user_id: str
    ) -> Task:
        """Update an existing task's fields and/or tag associations.

        Args:
            session (Session): Active database session transaction.
            task_id (str): Unique UUID string of the task to update.
            task_data (TaskUpdate): Pydantic update schema containing optional field updates.
            user_id (str): Authenticated user ID for permission check.

        Returns:
            Task: Updated Task model instance reflecting changes and updated_at timestamp.

        Raises:
            TaskNotFoundError: If the specified task does not exist or belong to user.
        """
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
        """Delete a task and its tag relationships from the database.

        Args:
            session (Session): Active database session transaction.
            task_id (str): Unique UUID string of the task to delete.
            user_id (str): Authenticated user ID for ownership validation.

        Raises:
            TaskNotFoundError: If task does not exist or belong to user.
        """
        task = self.get_task(session, task_id, user_id)
        self._task_repo.delete(session, task)
        session.commit()

    def toggle_task_completion(self, session: Session, task_id: str, user_id: str) -> Task:
        """Toggle the completed boolean status of a task.

        Args:
            session (Session): Active database session transaction.
            task_id (str): Unique UUID string of the task to toggle.
            user_id (str): Authenticated user ID for security validation.

        Returns:
            Task: Updated Task instance with toggled completed status and refreshed timestamp.

        Raises:
            TaskNotFoundError: If task does not exist or belong to user.
        """
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
