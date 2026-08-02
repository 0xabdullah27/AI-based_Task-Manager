"""SDK function tools for the Todo agent.

Wraps the shared todo_tools logic (mcp_server.tools.todo_tools) as OpenAI
Agents SDK function tools. The request's DB session and the authenticated
user_id are injected via RunContextWrapper — the LLM never sees them, so no
user_id prompt-hack is needed.

Each tool exists in two forms:
  - the raw async function (directly testable)
  - the FunctionTool wrapper (used by the Agent via AGENT_TOOLS)

Per spec, exposes 5 tools: add_task, list_tasks, complete_task, delete_task, update_task.
"""

from dataclasses import dataclass
from typing import List, Optional

from sqlmodel import Session

from agents import RunContextWrapper, function_tool

from mcp_server.tools.todo_tools import (
    add_task as _add_task,
    list_tasks as _list_tasks,
    complete_task as _complete_task,
    delete_task as _delete_task,
    update_task as _update_task,
)


@dataclass
class AgentContext:
    """Per-run context passed to every SDK tool.

    session: the shared request DB session (same one used for conversation history).
    user_id: the authenticated user's ID.
    Neither is ever sent to the LLM.
    """

    session: Session
    user_id: str


async def add_task(
    ctx: RunContextWrapper[AgentContext],
    title: str,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> dict:
    """Create a new todo task for the current user.

    Args:
        title: Task title (required).
        description: Task description (optional).
        priority: Priority level: none, low, medium, high (optional).
        tags: List of tags to attach (optional).
    """
    return _add_task(
        session=ctx.context.session,
        user_id=ctx.context.user_id,
        title=title,
        description=description,
        priority=priority,
        tags=tags,
    )


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
    return _list_tasks(
        session=ctx.context.session,
        user_id=ctx.context.user_id,
        status=status,
        priority=priority,
        search=search,
        tags=tags,
    )


async def complete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str,
) -> dict:
    """Mark a task as complete (toggles completion status).

    Args:
        task_id: ID of the task to complete (required).
    """
    return _complete_task(
        session=ctx.context.session,
        user_id=ctx.context.user_id,
        task_id=task_id,
    )


async def delete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: str,
) -> dict:
    """Delete a task from the list.

    Args:
        task_id: ID of the task to delete (required).
    """
    return _delete_task(
        session=ctx.context.session,
        user_id=ctx.context.user_id,
        task_id=task_id,
    )


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
    return _update_task(
        session=ctx.context.session,
        user_id=ctx.context.user_id,
        task_id=task_id,
        title=title,
        description=description,
        priority=priority,
        tags=tags,
    )


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
