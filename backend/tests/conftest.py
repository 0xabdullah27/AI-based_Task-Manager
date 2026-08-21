"""Pytest configuration and shared fixtures for backend tests."""
import pytest
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from src.main import app
from src.core.database import get_session
from src.core.security import get_current_user

# Register SQLModel models for metadata table creation
from src.models.user import User  # noqa: F401
from src.models.task import Task  # noqa: F401
from src.models.tag import Tag, TaskTag  # noqa: F401
from src.models.conversation import Conversation  # noqa: F401
from src.models.message import Message  # noqa: F401


@pytest.fixture(name="engine", scope="function")
def engine_fixture():
    """In-memory SQLite engine for unit and integration testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine):
    """Transactional DB session fixture."""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="mock_user_id")
def mock_user_id_fixture():
    """Default mock user ID for testing."""
    return "test-user-id"


@pytest.fixture(name="other_user_id")
def other_user_id_fixture():
    """Secondary mock user ID for user isolation tests."""
    return "other-user-id"


@pytest.fixture(name="client")
def client_fixture(session, mock_user_id):
    """FastAPI TestClient with overridden DB session and Auth user dependencies."""
    def get_session_override():
        yield session

    def get_current_user_override():
        return mock_user_id

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_current_user] = get_current_user_override

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()


@pytest.fixture(name="auth_headers")
def auth_headers_fixture():
    """Mock authorization header fixture."""
    return {"Authorization": "Bearer mock-token"}
