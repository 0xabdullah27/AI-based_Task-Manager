# Task: T007b | Spec: specs/006-agent-mcp-integration/spec.md
"""Unit tests for SDK function tools (src.services.agent.tools).

Each tool receives user_id + session via RunContextWrapper and delegates to the
shared todo_tools logic — verifying session and user_id are forwarded correctly.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def _make_wrapper(user_id: str = "user-1", session=None):
    """Create a RunContextWrapper mock with AgentContext."""
    ctx = MagicMock()
    ctx.session = session or MagicMock()
    ctx.user_id = user_id
    wrapper = MagicMock()
    wrapper.context = ctx
    return wrapper


class TestAddTaskTool:
    @pytest.mark.asyncio
    async def test_forwards_session_and_user_id_to_shared_logic(self):
        expected = {"task_id": "1", "status": "created", "title": "Buy milk"}
        with patch("src.services.agent.tools._add_task", return_value=expected) as mock_add:
            from src.services.agent.tools import add_task
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await add_task(wrapper, title="Buy milk", priority="high")
        assert result == expected
        mock_add.assert_called_once()
        assert mock_add.call_args.kwargs["session"] == "the-session"
        assert mock_add.call_args.kwargs["user_id"] == "u-1"
        assert mock_add.call_args.kwargs["title"] == "Buy milk"
        assert mock_add.call_args.kwargs["priority"] == "high"


class TestListTasksTool:
    @pytest.mark.asyncio
    async def test_forwards_session_and_filters(self):
        expected = [{"id": "1", "title": "Buy milk"}]
        with patch("src.services.agent.tools._list_tasks", return_value=expected) as mock_list:
            from src.services.agent.tools import list_tasks
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await list_tasks(wrapper, status="pending", search="milk")
        assert result == expected
        mock_list.assert_called_once()
        assert mock_list.call_args.kwargs["session"] == "the-session"
        assert mock_list.call_args.kwargs["user_id"] == "u-1"
        assert mock_list.call_args.kwargs["status"] == "pending"
        assert mock_list.call_args.kwargs["search"] == "milk"


class TestCompleteTaskTool:
    @pytest.mark.asyncio
    async def test_forwards_session_and_task_id(self):
        expected = {"task_id": "5", "status": "completed", "title": "Buy milk"}
        with patch("src.services.agent.tools._complete_task", return_value=expected) as mock_complete:
            from src.services.agent.tools import complete_task
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await complete_task(wrapper, task_id="5")
        assert result == expected
        mock_complete.assert_called_once()
        assert mock_complete.call_args.kwargs["session"] == "the-session"
        assert mock_complete.call_args.kwargs["user_id"] == "u-1"
        assert mock_complete.call_args.kwargs["task_id"] == "5"


class TestDeleteTaskTool:
    @pytest.mark.asyncio
    async def test_forwards_session_and_task_id(self):
        expected = {"task_id": "3", "status": "deleted", "title": "Old task"}
        with patch("src.services.agent.tools._delete_task", return_value=expected) as mock_delete:
            from src.services.agent.tools import delete_task
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await delete_task(wrapper, task_id="3")
        assert result == expected
        mock_delete.assert_called_once()
        assert mock_delete.call_args.kwargs["session"] == "the-session"
        assert mock_delete.call_args.kwargs["user_id"] == "u-1"
        assert mock_delete.call_args.kwargs["task_id"] == "3"


class TestUpdateTaskTool:
    @pytest.mark.asyncio
    async def test_forwards_session_and_fields(self):
        expected = {"task_id": "2", "status": "updated", "title": "New title"}
        with patch("src.services.agent.tools._update_task", return_value=expected) as mock_update:
            from src.services.agent.tools import update_task
            wrapper = _make_wrapper(user_id="u-1", session="the-session")
            result = await update_task(wrapper, task_id="2", title="New title", priority="low")
        assert result == expected
        mock_update.assert_called_once()
        assert mock_update.call_args.kwargs["session"] == "the-session"
        assert mock_update.call_args.kwargs["user_id"] == "u-1"
        assert mock_update.call_args.kwargs["task_id"] == "2"
        assert mock_update.call_args.kwargs["title"] == "New title"
        assert mock_update.call_args.kwargs["priority"] == "low"


class TestAgentToolsList:
    def test_agent_tools_exports_all_five(self):
        from src.services.agent.tools import AGENT_TOOLS, add_task, complete_task, delete_task, list_tasks, update_task
        names = [t.name for t in AGENT_TOOLS]
        assert sorted(names) == ["add_task", "complete_task", "delete_task", "list_tasks", "update_task"]
        assert len(AGENT_TOOLS) == 5
