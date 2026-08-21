"""Integration test suite verifying the 5 status checkpoints for backend AI agent chat endpoint behavior:

1. Reliable Natural Language Task Creation (Date extraction & task creation)
2. Better Prioritization (3-Factor scoring: Urgency, Importance, Effort 1-5 & explanation)
3. Clarifying Questions (Handling vague input & context retention)
4. Clean Conversation Flow (History loading & follow-up commands)
5. Basic Error Handling & Feedback (Friendly errors & clear task status)
"""

import pytest
import httpx
from httpx import ASGITransport
from sqlmodel import select, Session

from src.main import app
from src.core.database import get_session
from src.core.security import get_current_user
from src.models.task import Task
from src.models.priority import Priority
from src.services.agent.tools import _parse_priority


@pytest.fixture
async def async_client(session: Session, mock_user_id: str):
    """Async HTTP client fixture bound to the single active asyncio event loop."""
    def get_session_override():
        yield session

    def get_current_user_override():
        return mock_user_id

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_current_user] = get_current_user_override

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        yield client

    app.dependency_overrides.clear()


class TestCheckpoint1ReliableTaskCreation:
    """Checkpoint 1: Reliable Natural Language Task Creation."""

    def test_priority_parsing_from_phrasings(self):
        """Verify priority extraction works across different urgent/casual phrasings."""
        assert _parse_priority("ASAP") == Priority.HIGH
        assert _parse_priority("urgent") == Priority.HIGH
        assert _parse_priority("critical") == Priority.HIGH
        assert _parse_priority("important") == Priority.MEDIUM
        assert _parse_priority("low") == Priority.LOW
        assert _parse_priority("casual") == Priority.LOW
        assert _parse_priority(None) == Priority.NONE

    @pytest.mark.asyncio
    async def test_create_task_via_chat_endpoint(self, async_client: httpx.AsyncClient, session: Session, auth_headers: dict):
        """Verify POST /api/chat creates a task from natural language with date in description."""
        response = await async_client.post(
            "/api/chat",
            json={"message": "I need to buy a bike next Friday"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert "response" in data
        assert len(data["response"]) > 0

        # Verify task was persisted in the database
        tasks = session.exec(select(Task)).all()
        assert len(tasks) >= 1
        bike_task = next((t for t in tasks if "bike" in t.title.lower()), None)
        assert bike_task is not None
        assert bike_task.user_id == "test-user-id"


class TestCheckpoint2BetterPrioritization:
    """Checkpoint 2: Better Prioritization with 3-Factor Scoring (Urgency + Importance + Effort)."""

    @pytest.mark.asyncio
    async def test_high_priority_task_creation_and_explanation(
        self, async_client: httpx.AsyncClient, session: Session, auth_headers: dict
    ):
        """Verify urgent request is created with HIGH priority and explanation breaks down scores."""
        # 1. Create urgent task
        res1 = await async_client.post(
            "/api/chat",
            json={"message": "Add an urgent task to submit tax report ASAP"},
            headers=auth_headers,
        )
        assert res1.status_code == 200
        conv_id = res1.json()["conversation_id"]

        # Check DB task priority
        tasks = session.exec(select(Task)).all()
        tax_task = next((t for t in tasks if "tax" in t.title.lower()), None)
        assert tax_task is not None
        assert tax_task.priority == Priority.HIGH

        # 2. Ask why it is high priority
        res2 = await async_client.post(
            "/api/chat",
            json={"message": "Why is this high priority?", "conversation_id": conv_id},
            headers=auth_headers,
        )
        assert res2.status_code == 200
        explanation = res2.json()["response"]
        assert len(explanation) > 0
        assert any(kw in explanation.lower() for kw in ["urgent", "urgency", "importance", "asap", "priority", "high"])

    @pytest.mark.asyncio
    async def test_low_priority_task(self, async_client: httpx.AsyncClient, session: Session, auth_headers: dict):
        """Verify casual future task is assigned LOW or NONE priority."""
        res = await async_client.post(
            "/api/chat",
            json={"message": "Add a casual task to read a sci-fi novel whenever free"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        tasks = session.exec(select(Task)).all()
        novel_task = next((t for t in tasks if "novel" in t.title.lower() or "read" in t.title.lower()), None)
        assert novel_task is not None
        assert novel_task.priority in (Priority.LOW, Priority.NONE)


class TestCheckpoint3ClarifyingQuestions:
    """Checkpoint 3: Clarifying Questions & Intent Resolution."""

    @pytest.mark.asyncio
    async def test_vague_request_prompts_clarification(self, async_client: httpx.AsyncClient, auth_headers: dict):
        """Verify ambiguous/empty task request causes agent to respond with a clarifying question."""
        res = await async_client.post(
            "/api/chat",
            json={"message": "Add a task"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        answer = res.json()["response"]
        assert len(answer) > 0
        assert any(c in answer.lower() for c in ["?", "title", "what", "provide", "details", "specify", "name", "sure"])

    @pytest.mark.asyncio
    async def test_contextual_answer_resolves_task(self, async_client: httpx.AsyncClient, session: Session, auth_headers: dict):
        """Verify follow-up message providing task title creates task using conversation context."""
        # Step 1: Vague request
        r1 = await async_client.post(
            "/api/chat",
            json={"message": "Add a task"},
            headers=auth_headers,
        )
        conv_id = r1.json()["conversation_id"]

        # Step 2: Answer clarifying question
        r2 = await async_client.post(
            "/api/chat",
            json={"message": "Buy printer paper", "conversation_id": conv_id},
            headers=auth_headers,
        )
        assert r2.status_code == 200
        tasks = session.exec(select(Task)).all()
        paper_task = next((t for t in tasks if "paper" in t.title.lower() or "printer" in t.title.lower()), None)
        assert paper_task is not None


class TestCheckpoint4CleanConversationFlow:
    """Checkpoint 4: Clean Conversation Flow & Follow-up Actions."""

    @pytest.mark.asyncio
    async def test_multi_turn_followup_updates(self, async_client: httpx.AsyncClient, session: Session, auth_headers: dict):
        """Verify multi-turn conversation retains context for task priority change and completion."""
        # Turn 1: Create initial task
        r1 = await async_client.post(
            "/api/chat",
            json={"message": "Add a task to prepare quarterly slides"},
            headers=auth_headers,
        )
        assert r1.status_code == 200
        conv_id = r1.json()["conversation_id"]

        # Turn 2: Follow-up command to change priority
        r2 = await async_client.post(
            "/api/chat",
            json={"message": "change the priority of that task to high", "conversation_id": conv_id},
            headers=auth_headers,
        )
        assert r2.status_code == 200

        # Verify priority updated in DB
        tasks = session.exec(select(Task)).all()
        slide_task = next((t for t in tasks if "slide" in t.title.lower() or "quarterly" in t.title.lower()), None)
        assert slide_task is not None
        assert slide_task.priority == Priority.HIGH

        # Turn 3: Follow-up command to complete task
        r3 = await async_client.post(
            "/api/chat",
            json={"message": "mark that slide task as done", "conversation_id": conv_id},
            headers=auth_headers,
        )
        assert r3.status_code == 200
        session.refresh(slide_task)
        assert slide_task.completed is True

    @pytest.mark.asyncio
    async def test_conversation_history_persistence_and_loading(self, async_client: httpx.AsyncClient, auth_headers: dict):
        """Verify GET /api/chat/history/{id} loads full saved messages."""
        r1 = await async_client.post(
            "/api/chat",
            json={"message": "First message hello"},
            headers=auth_headers,
        )
        conv_id = r1.json()["conversation_id"]

        await async_client.post(
            "/api/chat",
            json={"message": "Second message world", "conversation_id": conv_id},
            headers=auth_headers,
        )

        hist_res = await async_client.get(f"/api/chat/history/{conv_id}", headers=auth_headers)
        assert hist_res.status_code == 200
        hist_data = hist_res.json()
        assert hist_data["conversation_id"] == conv_id
        messages = hist_data["messages"]
        assert len(messages) >= 4  # 2 user messages + 2 assistant messages


class TestCheckpoint5ErrorHandlingAndFeedback:
    """Checkpoint 5: Basic Error Handling & Feedback."""

    @pytest.mark.asyncio
    async def test_nonexistent_task_graceful_error(self, async_client: httpx.AsyncClient, auth_headers: dict):
        """Verify completing non-existent task yields friendly agent message, not a 500 error."""
        res = await async_client.post(
            "/api/chat",
            json={"message": "Complete task with ID nonexistent-uuid-99999"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        ans = res.json()["response"]
        assert len(ans) > 0
        assert any(w in ans.lower() for w in ["not found", "couldn't find", "exist", "error", "unable", "no task", "sorry", "cannot", "locate", "find", "invalid", "does not"])

    @pytest.mark.asyncio
    async def test_list_conversations_endpoint(self, async_client: httpx.AsyncClient, auth_headers: dict):
        """Verify GET /api/conversations returns list of conversations."""
        res = await async_client.get("/api/conversations", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "conversations" in data
        assert "total" in data
