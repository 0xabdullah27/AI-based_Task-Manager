"""Task API router endpoints for task creation, retrieval, filtering, updating, toggling, and deletion.

This layer handles HTTP request parsing, status codes, OpenAPI metadata, and delegates
all business logic and database queries to the service layer.
"""
from fastapi import APIRouter, Query, status, Request
from typing import List, Optional
import logging

from src.middleware.rate_limit import limiter
from src.api.deps import CurrentUser, DbSession
from src.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskRead,
    TaskListResponse,
    StatusFilter,
    PriorityFilter,
    SortField,
    SortOrder,
)
from src.services.task_service import task_service
from src.models.task import Task


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/todos", tags=["tasks"])


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
async def create_task(
    request: Request,
    task_data: TaskCreate,
    user_id: CurrentUser,
    session: DbSession,
) -> Task:
    """Create a new task item for the authenticated user.

    Args:
        task_data (TaskCreate): Validated request payload containing title, description, priority, and optional tags.
        user_id (CurrentUser): Authenticated user ID injected from JWT token dependency.
        session (DbSession): Active SQLModel database session dependency.

    Returns:
        Task: Created Task model instance (serialized to TaskRead response schema).
    """
    return task_service.create_task(session, task_data, user_id)


@router.get("/", response_model=TaskListResponse)
@limiter.limit("120/minute")
async def list_tasks(
    request: Request,
    user_id: CurrentUser,
    session: DbSession,
    search: Optional[str] = Query(default=None, description="Search term for task title or description"),
    status: StatusFilter = Query(default=StatusFilter.ALL, description="Filter tasks by completion status ('all', 'pending', 'completed')"),
    priority: PriorityFilter = Query(default=PriorityFilter.ALL, description="Filter tasks by priority level ('all', 'high', 'medium', 'low')"),
    tags: Optional[List[str]] = Query(default=None, description="List of tag names to filter tasks by"),
    no_tags: bool = Query(default=False, description="Filter for tasks without any tags"),
    sort: SortField = Query(default=SortField.PRIORITY, description="Field to sort tasks by ('priority', 'title', 'created_at')"),
    order: Optional[SortOrder] = Query(default=None, description="Sort direction ('asc' or 'desc')"),
    offset: int = Query(default=0, ge=0, description="Zero-based pagination offset index"),
    limit: int = Query(default=100, ge=1, le=100, description="Maximum number of tasks to return (1-100)"),
) -> TaskListResponse:
    """List tasks for the authenticated user with advanced filtering, searching, sorting, and pagination.

    Args:
        request (Request): Raw FastAPI request for rate limiter.
        user_id (CurrentUser): Authenticated user ID dependency for row-level security.
        session (DbSession): Active database session dependency.
        search (Optional[str]): Case-insensitive keyword search against task title and description.
        status (StatusFilter): Filter by completion status ('all', 'pending', 'completed').
        priority (PriorityFilter): Filter by priority ('all', 'high', 'medium', 'low').
        tags (Optional[List[str]]): Filter tasks that match any of the provided tag names.
        no_tags (bool): Filter for tasks that have no attached tags.
        sort (SortField): Primary field used for sorting results ('priority', 'title', 'created_at').
        order (Optional[SortOrder]): Direction of sort order ('asc' or 'desc'). Defaults depending on sort field.
        offset (int): Pagination start offset (>= 0).
        limit (int): Pagination limit (1 to 100).

    Returns:
        TaskListResponse: Object containing tasks list, total user task count, and count matching filters.
    """
    return task_service.get_tasks_with_counts(
        session=session,
        user_id=user_id,
        search=search,
        status=status,
        priority=priority,
        tags=tags,
        no_tags=no_tags,
        sort_field=sort,
        sort_order=order,
        offset=offset,
        limit=limit,
    )


@router.get("/{task_id}", response_model=TaskRead)
@limiter.limit("120/minute")
async def get_task(
    request: Request,
    task_id: str,
    user_id: CurrentUser,
    session: DbSession,
) -> Task:
    """Retrieve details of a specific task by its unique ID.

    Args:
        request (Request): Raw FastAPI request for rate limiter.
        task_id (str): Unique UUID path parameter identifying the task.
        user_id (CurrentUser): Authenticated user ID for security validation.
        session (DbSession): Active database session dependency.

    Returns:
        Task: Matched Task model instance with eager-loaded tags relationship.

    Raises:
        HTTPException: HTTP 404 NOT FOUND if task does not exist or belong to user.
    """
    return task_service.get_task_with_tags(session, task_id, user_id)


@router.patch("/{task_id}", response_model=TaskRead)
@limiter.limit("60/minute")
async def update_task(
    request: Request,
    task_id: str,
    task_data: TaskUpdate,
    user_id: CurrentUser,
    session: DbSession,
) -> Task:
    """Update fields and/or tag associations for a specific task.

    Args:
        request (Request): Raw FastAPI request for rate limiter.
        task_id (str): Unique UUID path parameter identifying the task to update.
        task_data (TaskUpdate): Validated request schema containing updated fields.
        user_id (CurrentUser): Authenticated user ID dependency.
        session (DbSession): Active database session dependency.

    Returns:
        Task: Updated Task model instance (serialized to TaskRead schema).

    Raises:
        HTTPException: HTTP 404 NOT FOUND if task is not found.
    """
    return task_service.update_task(session, task_id, task_data, user_id)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("60/minute")
async def delete_task(
    request: Request,
    task_id: str,
    user_id: CurrentUser,
    session: DbSession,
) -> None:
    """Delete a task record and its tag links by task ID.

    Args:
        request (Request): Raw FastAPI request for rate limiter.
        task_id (str): Unique UUID path parameter identifying the task to delete.
        user_id (CurrentUser): Authenticated user ID dependency.
        session (DbSession): Active database session dependency.

    Returns:
        None: Returns empty HTTP 204 No Content response upon successful deletion.

    Raises:
        HTTPException: HTTP 404 NOT FOUND if task is not found.
    """
    task_service.delete_task(session, task_id, user_id)


@router.post("/{task_id}/toggle", response_model=TaskRead)
@limiter.limit("120/minute")
async def toggle_task_completion(
    request: Request,
    task_id: str,
    user_id: CurrentUser,
    session: DbSession,
) -> Task:
    """Toggle the completion status of a specific task (Pending <-> Completed).

    Args:
        request (Request): Raw FastAPI request for rate limiter.
        task_id (str): Unique UUID path parameter identifying the task.
        user_id (CurrentUser): Authenticated user ID dependency.
        session (DbSession): Active database session dependency.

    Returns:
        Task: Updated Task model instance with updated completion status and timestamp.

    Raises:
        HTTPException: HTTP 404 NOT FOUND if task is not found.
    """
    return task_service.toggle_task_completion(session, task_id, user_id)
