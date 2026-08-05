"""SDK function tools for the Todo agent.

These tools call the task service directly and share the request DB session and
the authenticated user_id via RunContextWrapper — the LLM never sees them, so no
user_id prompt-hack is needed. (The mcp_server.tools.todo_tools module remains a
separate wrapper for standalone MCP integration; it is not used here.)

Per spec, exposes 5 tools: add_task, list_tasks, complete_task, delete_task, update_task.

Each tool exists in two forms:
  - the raw async function (directly testable)
  - the FunctionTool wrapper (used by the Agent via AGENT_TOOLS)
"""

from dataclasses import dataclass
from typing import List, Optional, Literal

from sqlmodel import Session

from agents import RunContextWrapper, function_tool

from src.models.priority import Priority
from src.schemas.task import TaskCreate, TaskUpdate
from src.services.task_service import task_service


@dataclass
class AgentContext:
    """Per-run context passed to every SDK tool.

    session: the shared request DB session (same one used for conversation history).
    user_id: the authenticated user's ID.
    Neither is ever sent to the LLM.
    """

    session: Session
    user_id: str


def _parse_priority(priority: Optional[str]) -> Priority:
    """Parse a priority string into a Priority enum, defaulting to NONE."""
    if not priority:
        return Priority.NONE
    upper = priority.upper()
    if upper in ("NONE", "LOW", "MEDIUM", "HIGH"):
        return Priority(upper)
    return Priority.NONE


async def add_task(
    ctx: RunContextWrapper[AgentContext],
    title: str,
    description: Optional[str] = None,
    priority: Literal["low", "medium", "high"] | None = None,
    tags: Optional[List[str]] = None,
) -> dict:
    print("========== add_task ==========")
    print("title =", title)
    print("priority =", priority)
    """Create a new todo task for the current user.

    Args:
        title: Task title (required).
        description: Task description (optional).

        priority: Optional priority.
        Allowed values:
        - "high"
        - "medium"
        - "low"
        Do not use any other value.
        If the user does not express urgency,
        leave this argument empty.

        tags: List of tags to attach (optional).
    """
    try:
        task_data = TaskCreate(
            title=title,
            description=description,
            priority=_parse_priority(priority),
            tags=tags or [],
            completed=False,
        )
        task = task_service.create_task(ctx.context.session, task_data, ctx.context.user_id)
        return {"task_id": task.id, "status": "created", "title": task.title}
    except Exception as e:
        return {"error": str(e)}


async def list_tasks(
    ctx: RunContextWrapper[AgentContext],
    status: Optional[str] = "all",
    priority: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> list:
    """Retrieve the current user's tasks with optional filtering.

    Args:
        status: Filter by status: "all", "pending", "completed" (default "all").
        priority: Filter by priority (optional).
        search: Search in title/description (optional).
        tags: Filter by tag names (optional).
    """
    try:
        status_map = {"all": None, "pending": "pending", "completed": "completed"}
        mapped_status = status_map.get(status or "all", None)

        tasks = task_service.list_tasks(
            session=ctx.context.session,
            user_id=ctx.context.user_id,
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


async def complete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str,
) -> dict:
    """Mark a task as complete (toggles completion status).

    Args:
        task_id: ID of the task to complete (required).
    """
    try:
        task = task_service.toggle_task_completion(
            ctx.context.session, task_id, ctx.context.user_id
        )
        status = "completed" if task.completed else "pending"
        return {"task_id": task.id, "status": status, "title": task.title}
    except Exception as e:
        return {"error": str(e)}


async def delete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str,
) -> dict:
    """Delete a task from the list.

    Args:
        task_id: ID of the task to delete (required).
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
) -> dict:
    """Update a task's title, description, priority, or tags.

    Args:
        task_id: ID of the task to update (required).
        title: New title (optional).
        description: New description (optional).
        priority: New priority: none, low, medium, high (optional).
        tags: New tags list (optional).
    """
    try:
        priority_val = _parse_priority(priority) if priority else None
        task_data = TaskUpdate(
            title=title,
            description=description,
            priority=priority_val,
            tags=tags,
        )
        task = task_service.update_task(
            ctx.context.session, task_id, task_data, ctx.context.user_id
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

# Tools the Todo agent can use
AGENT_TOOLS = [
    add_task_tool,
    list_tasks_tool,
    complete_task_tool,
    delete_task_tool,
    update_task_tool,
]