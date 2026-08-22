"""SDK function tools for the Todo AI agent.

These tools call the task service directly and share the request DB session and
the authenticated user_id via RunContextWrapper — the LLM never sees user IDs, so no
user_id prompt-injecting is needed.

Per spec, exposes 5 core tools: add_task, list_tasks, complete_task, delete_task, update_task.
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any

from sqlmodel import Session
from agents import RunContextWrapper, function_tool

from src.models.priority import Priority
from src.schemas import task
from src.schemas.task import TaskCreate, TaskUpdate
from src.services.task_service import task_service


@dataclass
class AgentContext:
    """Per-run context passed to every SDK agent tool.

    Attributes:
        session (Session): Shared SQLModel database session from the HTTP request context.
        user_id (str): ID of the authenticated user.
    """

    session: Session
    user_id: str


def _parse_priority(priority: Optional[str]) -> Priority:
    """Parse a raw string into a Priority enum, defaulting to Priority.LOW.

    Unspecified, unrecognized, or "none"-like input maps to LOW because every
    task must have a concrete stored priority.

    Args:
        priority (Optional[str]): Input priority string (e.g. "high", "urgent", "low").

    Returns:
        Priority: Matched Priority enum value (HIGH, MEDIUM, or LOW).
    """
    if not priority:
        return Priority.LOW
    upper = priority.upper().strip()
    if upper in ("HIGH", "URGENT", "ASAP", "CRITICAL", "EMERGENCY"):
        return Priority.HIGH
    elif upper in ("MEDIUM", "NORMAL", "IMPORTANT", "MODERATE"):
        return Priority.MEDIUM
    return Priority.LOW


def _normalize_priority_filter(priority: Optional[str]) -> Optional[str]:
    """Normalize an incoming priority filter string; None means no filtering.

    Rule: unspecified while fetching means all tasks. Empty, "all",
    and legacy "none"/"null" inputs map to None (no filter).
    """
    if priority is None:
        return None
    value = str(priority).strip().lower()
    if value in ("", "all", "none", "null"):
        return None
    return value


async def add_task(
    ctx: RunContextWrapper[AgentContext],
    title: str,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[List[str]] = None,
    parent_task_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new todo task for the current user.

    Args:
        ctx (RunContextWrapper[AgentContext]): Runtime agent context carrying request DB session and user_id.
        title (str): Short title of the task (required, 1 to 200 characters).
        description (Optional[str]): Optional task description or detailed notes (max 2000 characters).
        priority (Optional[str]): Urgency level. Allowed values: "high", "medium", "low".
            Do not pass any other value. If no urgency is expressed, leave empty
            (the task defaults to low priority).
        tags (Optional[List[str]]): Optional list of category tag names (e.g., ["work", "urgent"]).
        parent_task_id (Optional[str]): Optional UUID of an existing parent task. When provided,
            the new task is created as a subtask (step) under that parent. Use list_tasks first
            to find the parent's ID. A subtask cannot itself have subtasks.

    Returns:
        Dict[str, Any]: Dictionary containing 'task_id', 'status', 'title', and 'position'
        (for subtasks), or 'error' on failure.

    IMPORTANT: Call this function EXACTLY ONCE per task creation request.
    After receiving the return value, do NOT call add_task again for the same task.
    """
    try:
        task_data = TaskCreate(
            title=title,
            description=description,
            priority=_parse_priority(priority),
            tags=tags or [],
            completed=False,
            parent_id=parent_task_id,
        )
        task = task_service.create_task(
            ctx.context.session, task_data=task_data, user_id=ctx.context.user_id
        )
        result: Dict[str, Any] = {
            "task_id": task.id,
            "status": "created",
            "title": task.title,
            "priority": task.priority.value if hasattr(task.priority, "value") else str(task.priority),
            "message": (
                f"Subtask '{task.title}' created successfully under parent task."
                if task.parent_id
                else f"Task '{task.title}' created successfully."
            ),
        }
        if task.parent_id:
            result["parent_id"] = task.parent_id
            result["position"] = task.position
        return result
    except Exception as e:
        return {"error": str(e)}


async def list_tasks(
    ctx: RunContextWrapper[AgentContext],
    status: Optional[str] = "all",
    priority: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Retrieve the current user's tasks with optional filtering.

    Args:
        ctx (RunContextWrapper[AgentContext]): Runtime agent context carrying request DB session and user_id.
        status (Optional[str]): Filter by status: "all", "pending", or "completed" (default "all").
        priority (Optional[str]): Filter by priority: "high", "medium", or "low" (optional).
            Leave empty to retrieve ALL tasks regardless of priority.
        search (Optional[str]): Case-insensitive search keyword matching title or description (optional).
        tags (Optional[List[str]]): Filter tasks matching any of the specified tag names (optional).

    Returns:
        List[Dict[str, Any]]: List of task summary dictionaries, each containing 'id', 'title',
        'description', 'completed', 'priority', and 'tags'. Returns list with error dict on failure.
    """
    try:
        print("list_tasks called with\n status", status, "\npriority", priority, "\nsearch", search, "\ntags", tags)
        status_map = {"all": None, "pending": "pending", "completed": "completed"}
        mapped_status = status_map.get(status or "all", None)

        tasks = task_service.list_tasks(
            session=ctx.context.session,
            user_id=ctx.context.user_id,
            status=mapped_status,
            priority=_normalize_priority_filter(priority),
            search=search,
            tags=tags,
            limit=50,
        )
        print("tasks are:", tasks)
        if not tasks:
            return [{"info": "No tasks found matching your criteria."}]

        return [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "completed": t.completed,
                "priority": t.priority.value if hasattr(t.priority, "value") else str(t.priority),
                "tags": [tag.name for tag in t.tags] if t.tags else [],
                "subtasks": [
                    {
                        "id": s.id,
                        "title": s.title,
                        "completed": s.completed,
                        "position": s.position,
                    }
                    for s in sorted(
                        (t.subtasks or []),
                        key=lambda s: (s.position is None, s.position if s.position is not None else 0),
                    )
                ],
                "subtask_progress": (
                    f"{sum(1 for s in (t.subtasks or []) if s.completed)}/{len(t.subtasks or [])} done"
                    if t.subtasks
                    else None
                ),
            }
            for t in tasks
        ]
    except Exception as e:
        return [{"error": str(e)}]


async def complete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str,
) -> Dict[str, Any]:
    """Mark a task as complete (or toggle completion status) for the user.

    Args:
        ctx (RunContextWrapper[AgentContext]): Runtime agent context carrying request DB session and user_id.
        task_id (str): Unique UUID string of the target task to complete (required).

    Returns:
        Dict[str, Any]: Dictionary containing 'task_id', 'status' ("completed" or "pending"), and 'title'.
    """
    try:
        task = task_service.toggle_task_completion(
            ctx.context.session, task_id, ctx.context.user_id
        )
        status_str = "completed" if task.completed else "pending"
        return {"task_id": task.id, "status": status_str, "title": task.title}
    except Exception as e:
        return {"error": str(e)}


async def delete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str,
) -> Dict[str, Any]:
    """Permanently delete a task from the user's task list.

    If the task is a parent with subtasks, ALL of its subtasks are deleted as well.

    Args:
        ctx (RunContextWrapper[AgentContext]): Runtime agent context carrying request DB session and user_id.
        task_id (str): Unique UUID string of the target task to delete (required).

    Returns:
        Dict[str, Any]: Dictionary containing 'task_id', 'status' ("deleted"), and 'title'.
    """
    try:
        task = task_service.get_task(ctx.context.session, task_id, ctx.context.user_id)
        title = task.title
        task_service.delete_task(ctx.context.session, task_id, ctx.context.user_id)
        return {"task_id": task_id, "status": "deleted", "title": title}
    except Exception as e:
        return {"error": str(e)}


async def update_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[List[str]] = None,
    parent_task_id: Optional[str] = None,
    position: Optional[int] = None,
) -> Dict[str, Any]:
    """Update a task's title, description, priority, tags, step order, or parent.

    Args:
        ctx (RunContextWrapper[AgentContext]): Runtime agent context carrying request DB session and user_id.
        task_id (str): Unique UUID string of the target task to update (required).
        title (Optional[str]): Updated task title string (optional).
        description (Optional[str]): Updated task description string (optional).
        priority (Optional[str]): Updated priority level: "high", "medium", or "low" (optional).
            Leave empty to keep the current priority unchanged.
        tags (Optional[List[str]]): Updated list of tag names (optional).
        parent_task_id (Optional[str]): UUID of an existing root task to move this task under,
            turning it into a subtask (optional). One nesting level only.
        position (Optional[int]): New 1-based step ordering position among sibling subtasks (optional).

    Returns:
        Dict[str, Any]: Dictionary containing 'task_id', 'status' ("updated"), and 'title'.
    """
    try:
        priority_val = _parse_priority(priority) if priority else None
        task_data = TaskUpdate(
            title=title,
            description=description,
            priority=priority_val,
            tags=tags,
            parent_id=parent_task_id,
            position=position,
        )
        task = task_service.update_task(
            ctx.context.session, task_id, task_data=task_data, user_id=ctx.context.user_id
        )
        return {"task_id": task.id, "status": "updated", "title": task.title}
    except Exception as e:
        return {"error": str(e)}


# FunctionTool wrappers for the Agent
add_task_tool = function_tool(add_task)
list_tasks_tool = function_tool(list_tasks)
complete_task_tool = function_tool(complete_task)
delete_task_tool = function_tool(delete_task)
update_task_tool = function_tool(update_task)

# Tools exported for the Todo agent
AGENT_TOOLS = [
    add_task_tool,
    list_tasks_tool,
    complete_task_tool,
    delete_task_tool,
    update_task_tool,
]