#!/usr/bin/env python3
"""MCP server exposing Todo backend services as tools.

This server is mounted inside the FastAPI app at /mcp.
The agent connects to it via MCPServerStreamableHttp.

Per spec, exposes 5 tools: add_task, list_tasks, complete_task, delete_task, update_task.
All tools accept user_id as required parameter.
"""

import json
from typing import Optional, List
from mcp.server.fastmcp import FastMCP

# Initialize MCP server
mcp = FastMCP(
    "todo_mcp",
    stateless_http=True,
    # streamable_http_path="/",  # Maps exactly to the mount point (app.mount("/mcp"))
)
# print("mcp.settings is ", mcp.settings)
mcp.settings.streamable_http_path = "/"
# print("mcp.settings.streamable_http_path is ", mcp.settings.streamable_http_path)

# mcp_app = mcp.streamable_http_app(mount_path="/")

# ── MCP Tools (wrapping todo_tools functions) ──


@mcp.tool(
    name="add_task",
    annotations={
        "title": "Add a new task",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True,
    },
)
async def add_task(
    user_id: str,
    title: str,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> str:
    """Create a new todo task for a user.

    Args:
        user_id: The authenticated user's ID (required).
        title: Task title (required).
        description: Task description (optional).
        priority: Priority level: none, low, medium, high (optional).
        tags: List of tags to attach (optional).
    """

    from mcp_server.tools.todo_tools import add_task as _add_task
    result = _add_task(
        user_id=user_id,
        title=title,
        description=description,
        priority=priority,
        tags=tags,
    )
    return json.dumps(result)


@mcp.tool(
    name="list_tasks",
    annotations={
        "title": "List todo tasks",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def list_tasks(
    user_id: str,
    status: Optional[str] = "all",
    priority: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> str:
    """Retrieve tasks for a user with optional filtering.

    Args:
        user_id: The authenticated user's ID (required).
        status: Filter by status: "all", "pending", "completed" (optional, default "all").
        priority: Filter by priority (optional).
        search: Search in title/description (optional).
        tags: Filter by tag names (optional).
    """
    from mcp_server.tools.todo_tools import list_tasks as _list_tasks

    result = _list_tasks(
        user_id=user_id,
        status=status,
        priority=priority,
        search=search,
        tags=tags,
    )
    return json.dumps(result)


@mcp.tool(
    name="complete_task",
    annotations={
        "title": "Complete a task",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True,
    },
)
async def complete_task(user_id: str, task_id: str) -> str:
    """Mark a task as complete (toggles completion status).

    Args:
        user_id: The authenticated user's ID (required).
        task_id: ID of the task to complete (required).
    """
    from mcp_server.tools.todo_tools import complete_task as _complete_task

    result = _complete_task(user_id=user_id, task_id=task_id)
    return json.dumps(result)


@mcp.tool(
    name="delete_task",
    annotations={
        "title": "Delete a task",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": False,
        "openWorldHint": True,
    },
)
async def delete_task(user_id: str, task_id: str) -> str:
    """Remove a task from the list.

    Args:
        user_id: The authenticated user's ID (required).
        task_id: ID of the task to delete (required).
    """
    from mcp_server.tools.todo_tools import delete_task as _delete_task

    result = _delete_task(user_id=user_id, task_id=task_id)
    return json.dumps(result)


@mcp.tool(
    name="update_task",
    annotations={
        "title": "Update a task",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True,
    },
)
async def update_task(
    user_id: str,
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> str:
    """Modify task title, description, priority, or tags.

    Args:
        user_id: The authenticated user's ID (required).
        task_id: ID of the task to update (required).
        title: New title (optional).
        description: New description (optional).
        priority: New priority: none, low, medium, high (optional).
        tags: New tags list (optional).
    """
    from mcp_server.tools.todo_tools import update_task as _update_task

    result = _update_task(
        user_id=user_id,
        task_id=task_id,
        title=title,
        description=description,
        priority=priority,
        tags=tags,
    )
    return json.dumps(result)


# Export the Starlette ASGI app for mounting in FastAPI
mcp_app = mcp.streamable_http_app()
