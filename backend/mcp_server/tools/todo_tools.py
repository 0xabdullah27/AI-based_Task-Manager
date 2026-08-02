"""Shared Todo tool functions.

These functions are the single source of truth for agent task operations.
They accept a caller-provided ``session`` so the same DB session can be shared
across a request (used both by the SDK function tools and the MCP server).

Per spec, the 5 required tools are:
  add_task, list_tasks, complete_task, delete_task, update_task
"""
from typing import Optional, List

from sqlmodel import Session

from src.services.task_service import task_service
from src.services.tag_service import tag_service
from src.schemas.task import TaskCreate, TaskUpdate
from src.models.priority import Priority
from src.core.database import engine


def get_session() -> Session:
    """Create a database session for standalone (MCP) tool operations."""
    return Session(engine)


def _parse_priority(priority_str: Optional[str]) -> Priority:
    """Parse a priority string into a Priority enum, defaulting to NONE."""
    if not priority_str:
        return Priority.NONE
    upper = priority_str.upper()
    if upper in ("NONE", "LOW", "MEDIUM", "HIGH"):
        return Priority(upper)
    return Priority.NONE


def add_task(
    session: Session,
    user_id: str,
    title: str,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> dict:
    """Create a new task.

    Args:
        session: DB session to use (shared across the request).
        user_id: The authenticated user's ID (required).
        title: Task title (required).
        description: Task description (optional).
        priority: Priority level: none, low, medium, high (optional).
        tags: List of tags to attach (optional).

    Returns:
        dict with task_id, status, title.
    """
    try:
        task_data = TaskCreate(
            title=title,
            description=description,
            priority=_parse_priority(priority),
            tags=tags or [],
            completed=False,
        )
        task = task_service.create_task(session, task_data, user_id)
        return {"task_id": task.id, "status": "created", "title": task.title}
    except Exception as e:
        return {"error": str(e)}


def list_tasks(
    session: Session,
    user_id: str,
    status: Optional[str] = "all",
    priority: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> list:
    """Retrieve tasks for a user with optional filtering.

    Args:
        session: DB session to use (shared across the request).
        user_id: The authenticated user's ID (required).
        status: Filter by status: "all", "pending", "completed" (optional, default "all").
        priority: Filter by priority: "none", "low", "medium", "high" (optional).
        search: Search in title/description (optional).
        tags: Filter by tag names (optional).

    Returns:
        List of task objects.
    """
    try:
        status_map = {"all": None, "pending": "pending", "completed": "completed"}
        mapped_status = status_map.get(status or "all", None)

        tasks = task_service.list_tasks(
            session,
            user_id=user_id,
            status=mapped_status,
            priority=None if not priority or priority == "all" else priority,
            search=search,
            tags=tags,
            limit=50,
        )

        return [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "completed": t.completed,
                "priority": t.priority.value if hasattr(t.priority, "value") else str(t.priority),
                "tags": [tag.name for tag in t.tags] if t.tags else [],
            }
            for t in tasks
        ]
    except Exception as e:
        return [{"error": str(e)}]


def complete_task(session: Session, user_id: str, task_id: str) -> dict:
    """Mark a task as complete (toggle completion).

    Args:
        session: DB session to use (shared across the request).
        user_id: The authenticated user's ID (required).
        task_id: ID of the task to complete (required).

    Returns:
        dict with task_id, status, title.
    """
    try:
        task = task_service.toggle_task_completion(session, task_id, user_id)
        status = "completed" if task.completed else "pending"
        return {"task_id": task.id, "status": status, "title": task.title}
    except Exception as e:
        return {"error": str(e)}


def delete_task(session: Session, user_id: str, task_id: str) -> dict:
    """Remove a task from the list.

    Args:
        session: DB session to use (shared across the request).
        user_id: The authenticated user's ID (required).
        task_id: ID of the task to delete (required).

    Returns:
        dict with task_id, status, title.
    """
    try:
        # Get task info before deleting
        task = task_service.get_task(session, task_id, user_id)
        title = task.title
        task_service.delete_task(session, task_id, user_id)
        return {"task_id": task_id, "status": "deleted", "title": title}
    except Exception as e:
        return {"error": str(e)}


def update_task(
    session: Session,
    user_id: str,
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> dict:
    """Modify task title, description, priority, or tags.

    Args:
        session: DB session to use (shared across the request).
        user_id: The authenticated user's ID (required).
        task_id: ID of the task to update (required).
        title: New title (optional).
        description: New description (optional).
        priority: New priority: none, low, medium, high (optional).
        tags: New tags list (optional).

    Returns:
        dict with task_id, status, title.
    """
    try:
        priority_val = None
        if priority:
            priority_val = _parse_priority(priority)

        task_data = TaskUpdate(
            title=title,
            description=description,
            priority=priority_val,
            tags=tags,
        )
        task = task_service.update_task(session, task_id, task_data, user_id)
        return {"task_id": task.id, "status": "updated", "title": task.title}
    except Exception as e:
        return {"error": str(e)}
