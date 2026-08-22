# Task: T007b | Spec: specs/006-agent-mcp-integration/spec.md
"""Unit tests for SDK function tools (src.services.agent.tools).

Each tool receives user_id + session via RunContextWrapper and calls the task
service directly — verifying session and user_id are forwarded correctly.
"""
import pytest
from unittest.mock import MagicMock, patch

from src.services.agent.tools import (
    AGENT_TOOLS,
    add_task,
    complete_task,
    delete_task,
    list_tasks,
    update_task,
)


def _make_wrapper(user_id: str = "user-1", session=None):
    """Create a RunContextWrapper mock with AgentContext."""
    ctx = MagicMock()
    ctx.session = session or MagicMock()
    ctx.user_id = user_id
    wrapper = MagicMock()
    wrapper.context = ctx
    return wrapper


def _make_task(task_id="1", title="Buy milk", completed=False, priority="low", tags=None):
    task = MagicMock()
    task.id = task_id
    task.title = title
    task.completed = completed
    task.priority = MagicMock()
    task.priority.value = priority
    task.tags = [MagicMock(name=name) for name in (tags or [])]
    task.parent_id = None
    task.position = None
    task.subtasks = []
    return task


class TestAddTaskTool:
    @pytest.mark.asyncio
    async def test_creates_task_via_service_with_session_and_user_id(self):
        task = _make_task()
        with patch("src.services.agent.tools.task_service.create_task", return_value=task) as mock_create:
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await add_task(wrapper, title="Buy milk", priority="high")
        assert result == {
            "task_id": "1",
            "status": "created",
            "title": "Buy milk",
            "priority": "low",
            "message": "Task 'Buy milk' created successfully.",
        }
        mock_create.assert_called_once()
        args, kwargs = mock_create.call_args
        assert args[0] == "the-session"
        assert kwargs["user_id"] == "u-1"
        assert kwargs["task_data"].title == "Buy milk"

    @pytest.mark.asyncio
    async def test_returns_error_dict_on_failure(self):
        with patch("src.services.agent.tools.task_service.create_task", side_effect=ValueError("boom")):
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await add_task(wrapper, title="Buy milk")
        assert "error" in result
        assert "boom" in result["error"]

    @pytest.mark.asyncio
    async def test_unspecified_priority_defaults_to_low(self):
        task = _make_task()
        with patch("src.services.agent.tools.task_service.create_task", return_value=task) as mock_create:
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            await add_task(wrapper, title="Buy milk")
        assert mock_create.call_args.kwargs["task_data"].priority == "low"


class TestListTasksTool:
    @pytest.mark.asyncio
    async def test_lists_tasks_via_service_with_filters(self):
        task = _make_task()
        with patch("src.services.agent.tools.task_service.list_tasks", return_value=[task]) as mock_list:
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await list_tasks(wrapper, status="pending", search="milk")
        assert result[0]["id"] == task.id
        assert result[0]["title"] == task.title
        mock_list.assert_called_once()
        assert mock_list.call_args.kwargs["session"] == "the-session"
        assert mock_list.call_args.kwargs["user_id"] == "u-1"
        assert mock_list.call_args.kwargs["status"] == "pending"
        assert mock_list.call_args.kwargs["search"] == "milk"

    @pytest.mark.asyncio
    async def test_unspecified_priority_filter_returns_all(self):
        """Omitted or 'none'/'all'/'null' priority means NO filter (all tasks)."""
        task = _make_task()
        for raw in (None, "", "all", "None", "none", "null"):
            with patch("src.services.agent.tools.task_service.list_tasks", return_value=[task]) as mock_list:
                wrapper = _make_wrapper(user_id="u-1", session="the-session")
                await list_tasks(wrapper, priority=raw)
            assert mock_list.call_args.kwargs["priority"] is None, f"raw={raw!r}"

    @pytest.mark.asyncio
    async def test_explicit_priority_filter_is_forwarded(self):
        task = _make_task()
        with patch("src.services.agent.tools.task_service.list_tasks", return_value=[task]) as mock_list:
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            await list_tasks(wrapper, priority="HIGH")
        assert mock_list.call_args.kwargs["priority"] == "high"


class TestParsePriorityDefaults:
    def test_unspecified_or_none_like_defaults_to_low(self):
        from src.services.agent.tools import _parse_priority
        from src.models.priority import Priority

        for raw in (None, "", "  ", "none", "NULL"):
            assert _parse_priority(raw) == Priority.LOW

    def test_synonyms_map_correctly(self):
        from src.services.agent.tools import _parse_priority
        from src.models.priority import Priority

        assert _parse_priority("urgent") == Priority.HIGH
        assert _parse_priority("important") == Priority.MEDIUM
        assert _parse_priority("casual") == Priority.LOW


class TestCompleteTaskTool:
    @pytest.mark.asyncio
    async def test_toggles_completion_via_service(self):
        task = _make_task(completed=True)
        with patch("src.services.agent.tools.task_service.toggle_task_completion", return_value=task) as mock_toggle:
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await complete_task(wrapper, task_id="5")
        assert result["status"] == "completed"
        mock_toggle.assert_called_once()
        assert mock_toggle.call_args.args[0] == "the-session"
        assert mock_toggle.call_args.args[1] == "5"
        assert mock_toggle.call_args.args[2] == "u-1"


class TestDeleteTaskTool:
    @pytest.mark.asyncio
    async def test_deletes_task_via_service(self):
        task = _make_task(task_id="3", title="Old task")
        with patch("src.services.agent.tools.task_service.get_task", return_value=task) as mock_get, \
             patch("src.services.agent.tools.task_service.delete_task") as mock_del:
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await delete_task(wrapper, task_id="3")
        assert result == {"task_id": "3", "status": "deleted", "title": "Old task"}
        mock_get.assert_called_once()
        mock_del.assert_called_once()
        assert mock_get.call_args.args[0] == "the-session"


class TestUpdateTaskTool:
    @pytest.mark.asyncio
    async def test_updates_task_via_service(self):
        task = _make_task(task_id="2", title="New title")
        with patch("src.services.agent.tools.task_service.update_task", return_value=task) as mock_update:
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await update_task(wrapper, task_id="2", title="New title", priority="low")
        assert result["title"] == "New title"
        mock_update.assert_called_once()
        assert mock_update.call_args.args[0] == "the-session"
        assert mock_update.call_args.args[1] == "2"
        assert mock_update.call_args.kwargs["task_data"].title == "New title"
        assert mock_update.call_args.kwargs["user_id"] == "u-1"


class TestAgentToolsList:
    def test_agent_tools_exports_all_five(self):
        names = [t.name for t in AGENT_TOOLS]
        assert sorted(names) == ["add_task", "complete_task", "delete_task", "list_tasks", "update_task"]
        assert len(AGENT_TOOLS) == 5