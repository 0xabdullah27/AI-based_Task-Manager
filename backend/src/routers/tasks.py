"""Task API endpoints."""
from fastapi import APIRouter, Query, status
from sqlmodel import select, func
from typing import List, Optional
import logging

from src.api.deps import CurrentUser, DbSession
from src.schemas.task import TaskCreate, TaskUpdate, TaskRead, TaskListResponse
from src.services.task_service import task_service as task_crud
from src.models.task import Task


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/todos", tags=["tasks"])


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    user_id: CurrentUser,
    session: DbSession,
):
    """Create a new task."""
    return task_crud.create_task(session, task_data, user_id)


@router.get("/", response_model=TaskListResponse)
async def list_tasks(
    user_id: CurrentUser,
    session: DbSession,
    search: Optional[str] = None,
    status: str = "all",
    priority: str = "all",
    tags: Optional[List[str]] = Query(default=None),
    no_tags: bool = False,
    sort: str = "priority",
    order: Optional[str] = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
):
    """List tasks for the authenticated user with filtering, searching, sorting, and pagination."""
    total_statement = select(func.count(Task.id)).where(Task.user_id == user_id)
    total = session.exec(total_statement).one()

    tasks = task_crud.list_tasks(
        session=session,
        user_id=user_id,
        search=search,
        status=status,
        priority=priority,
        tags=tags,
        no_tags=no_tags,
        sort_field=sort,
        sort_order=order or ("desc" if sort == "created_at" else "asc"),
        offset=offset,
        limit=limit,
    )

    query = select(func.count(Task.id)).where(Task.user_id == user_id)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            Task.title.ilike(search_term) |
            Task.description.ilike(search_term)
        )

    if status and status != "all":
        if status == "pending":
            query = query.where(Task.completed == False)
        elif status == "completed":
            query = query.where(Task.completed == True)

    if priority and priority != "all":
        query = query.where(Task.priority == priority)

    if tags:
        from src.models.tag import TaskTag, Tag
        query = query.join(TaskTag).join(Tag).where(Tag.name.in_(tags))

    if no_tags:
        from src.models.tag import TaskTag
        query = query.outerjoin(TaskTag).where(TaskTag.task_id.is_(None))

    filtered = session.exec(query).one()

    return TaskListResponse(tasks=tasks, total=total, filtered=filtered)


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(
    task_id: str,
    user_id: CurrentUser,
    session: DbSession,
):
    """Get a specific task by ID."""
    return task_crud.get_task_with_tags(session, task_id, user_id)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    user_id: CurrentUser,
    session: DbSession,
):
    """Update a task."""
    return task_crud.update_task(session, task_id, task_data, user_id)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    user_id: CurrentUser,
    session: DbSession,
):
    """Delete a task."""
    task_crud.delete_task(session, task_id, user_id)


@router.post("/{task_id}/toggle", response_model=TaskRead)
async def toggle_task_completion(
    task_id: str,
    user_id: CurrentUser,
    session: DbSession,
):
    """Toggle task completion status."""
    return task_crud.toggle_task_completion(session, task_id, user_id)
