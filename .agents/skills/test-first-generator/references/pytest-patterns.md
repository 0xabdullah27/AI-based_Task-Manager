# pytest Testing Patterns

Comprehensive patterns for testing Python code with pytest.

## pytest Configuration

### pyproject.toml

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "--strict-markers",
    "--strict-config",
    "--cov=app",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-fail-under=70",
]
markers = [
    "unit: Unit tests",
    "integration: Integration tests",
    "slow: Slow running tests",
]
```

### conftest.py

```python
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_session

@pytest.fixture(name="session")
def session_fixture():
    """Create in-memory SQLite database for testing"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create test client with overridden database session"""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
```

## Fixtures

### Basic Fixtures

```python
import pytest

@pytest.fixture
def sample_todo():
    """Provide a sample todo for testing"""
    return {
        "id": "1",
        "title": "Test Todo",
        "completed": False,
        "user_id": "user-1"
    }

@pytest.fixture
def sample_user():
    """Provide a sample user for testing"""
    return {
        "id": "user-1",
        "email": "test@example.com",
        "name": "Test User"
    }
```

### Fixture Scopes

```python
@pytest.fixture(scope="function")  # Default: new instance per test
def function_fixture():
    return "New for each test"

@pytest.fixture(scope="class")  # Shared across test class
def class_fixture():
    return "Shared in class"

@pytest.fixture(scope="module")  # Shared across module
def module_fixture():
    return "Shared in module"

@pytest.fixture(scope="session")  # Shared across entire session
def session_fixture():
    return "Shared in session"
```

### Fixture Factories

```python
@pytest.fixture
def make_todo():
    """Factory fixture to create todos with custom data"""
    def _make_todo(title="Test", completed=False, user_id="user-1"):
        return {
            "title": title,
            "completed": completed,
            "user_id": user_id
        }
    return _make_todo

# Usage
def test_create_todo(make_todo):
    todo1 = make_todo(title="First Todo")
    todo2 = make_todo(title="Second Todo", completed=True)
```

### Fixture Autouse

```python
@pytest.fixture(autouse=True)
def reset_database(session):
    """Automatically reset database before each test"""
    session.rollback()
    yield
    session.rollback()
```

### Fixture Dependencies

```python
@pytest.fixture
def user(session):
    """Create a user in the database"""
    user = User(email="test@example.com", name="Test User")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@pytest.fixture
def todo(session, user):
    """Create a todo for the user"""
    todo = Todo(title="Test Todo", user_id=user.id)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo

# Usage: pytest automatically resolves dependencies
def test_todo_belongs_to_user(todo, user):
    assert todo.user_id == user.id
```

## Parametrization

### Basic Parametrization

```python
import pytest

@pytest.mark.parametrize("input,expected", [
    ("", False),
    ("a", True),
    ("test", True),
    ("a" * 201, False),  # Too long
])
def test_validate_title(input, expected):
    """Test title validation with various inputs"""
    assert validate_title(input) == expected
```

### Multiple Parameters

```python
@pytest.mark.parametrize("title,completed,expected_status", [
    ("Test", True, "done"),
    ("Test", False, "pending"),
    ("Urgent", False, "urgent"),
])
def test_todo_status(title, completed, expected_status):
    """Test todo status calculation"""
    todo = Todo(title=title, completed=completed)
    assert todo.status == expected_status
```

### Parametrize with IDs

```python
@pytest.mark.parametrize("input,expected", [
    pytest.param("", False, id="empty_string"),
    pytest.param("a", True, id="single_char"),
    pytest.param("test", True, id="valid_string"),
], ids=["empty", "single", "valid"])
def test_validate_title_with_ids(input, expected):
    assert validate_title(input) == expected
```

### Indirect Parametrization

```python
@pytest.fixture
def user_data(request):
    """Fixture that accepts parameters"""
    return request.param

@pytest.mark.parametrize("user_data", [
    {"email": "test@example.com", "name": "Test User"},
    {"email": "admin@example.com", "name": "Admin User"},
], indirect=True)
def test_create_user(user_data, session):
    user = User(**user_data)
    session.add(user)
    session.commit()
    assert user.email == user_data["email"]
```

## Markers

### Built-in Markers

```python
import pytest

@pytest.mark.skip(reason="Not implemented yet")
def test_future_feature():
    pass

@pytest.mark.skipif(sys.version_info < (3, 10), reason="Requires Python 3.10+")
def test_python_310_feature():
    pass

@pytest.mark.xfail(reason="Known bug")
def test_known_issue():
    pass
```

### Custom Markers

```python
# conftest.py
def pytest_configure(config):
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow running tests")

# test file
@pytest.mark.unit
def test_fast_unit_test():
    pass

@pytest.mark.integration
@pytest.mark.slow
def test_slow_integration():
    pass

# Run specific markers:
# pytest -m unit
# pytest -m "integration and not slow"
```

## Mocking with unittest.mock

### Mock Functions

```python
from unittest.mock import Mock, MagicMock

def test_todo_service_calls_repository():
    # Create mock
    mock_repo = Mock()
    mock_repo.get_todos.return_value = [{"id": "1", "title": "Test"}]

    # Use mock
    service = TodoService(mock_repo)
    todos = service.get_todos()

    # Verify
    mock_repo.get_todos.assert_called_once()
    assert len(todos) == 1
```

### Mock Return Values

```python
from unittest.mock import Mock

def test_mock_return_values():
    mock = Mock()

    # Simple return value
    mock.return_value = 42
    assert mock() == 42

    # Different return values for each call
    mock.side_effect = [1, 2, 3]
    assert mock() == 1
    assert mock() == 2
    assert mock() == 3

    # Raise exception
    mock.side_effect = ValueError("Invalid")
    with pytest.raises(ValueError):
        mock()
```

### Mock Async Functions

```python
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_async_function():
    mock = AsyncMock(return_value="result")

    result = await mock()

    assert result == "result"
    mock.assert_awaited_once()
```

### Patch Decorator

```python
from unittest.mock import patch

@patch('app.services.todo_repository.get_todos')
def test_todo_service_with_patch(mock_get_todos):
    # Configure mock
    mock_get_todos.return_value = [{"id": "1", "title": "Test"}]

    # Use service
    service = TodoService()
    todos = service.get_todos()

    # Verify
    assert len(todos) == 1
    mock_get_todos.assert_called_once()
```

### Patch Context Manager

```python
from unittest.mock import patch

def test_with_context_manager():
    with patch('app.services.todo_repository.get_todos') as mock_get:
        mock_get.return_value = []

        service = TodoService()
        todos = service.get_todos()

        assert todos == []
```

### Patch Object

```python
from unittest.mock import patch

def test_patch_object():
    with patch.object(TodoRepository, 'get_todos', return_value=[]):
        repo = TodoRepository()
        todos = repo.get_todos()
        assert todos == []
```

## Testing Exceptions

### Basic Exception Testing

```python
import pytest

def test_raises_exception():
    with pytest.raises(ValueError):
        raise ValueError("Error message")
```

### Verify Exception Message

```python
def test_exception_message():
    with pytest.raises(ValueError, match="Invalid title"):
        create_todo({"title": ""})
```

### Capture Exception Info

```python
def test_exception_details():
    with pytest.raises(ValidationError) as exc_info:
        create_todo({"title": ""})

    assert "title" in str(exc_info.value)
    assert exc_info.type is ValidationError
```

## Testing FastAPI Endpoints

### Basic Endpoint Testing

```python
def test_get_todos(client):
    """Test GET /api/todos endpoint"""
    response = client.get("/api/todos")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

### Testing POST Requests

```python
def test_create_todo(client):
    """Test creating a new todo"""
    # Arrange
    todo_data = {
        "title": "Test Todo",
        "completed": False
    }

    # Act
    response = client.post("/api/todos", json=todo_data)

    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == todo_data["title"]
    assert "id" in data
```

### Testing with Authentication

```python
@pytest.fixture
def auth_headers():
    """Provide authentication headers"""
    token = create_test_token(user_id="user-1")
    return {"Authorization": f"Bearer {token}"}

def test_protected_endpoint(client, auth_headers):
    """Test endpoint requiring authentication"""
    response = client.get("/api/todos", headers=auth_headers)

    assert response.status_code == 200
```

### Testing Validation Errors

```python
def test_create_todo_validation_error(client):
    """Test validation error response"""
    # Missing required field
    invalid_data = {"completed": False}

    response = client.post("/api/todos", json=invalid_data)

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(error["loc"] == ["body", "title"] for error in errors)
```

## Testing Database Operations

### Testing CRUD Operations

```python
def test_create_todo_in_database(session):
    """Test creating todo in database"""
    # Arrange
    todo = Todo(title="Test Todo", user_id="user-1")

    # Act
    session.add(todo)
    session.commit()
    session.refresh(todo)

    # Assert
    assert todo.id is not None
    assert todo.title == "Test Todo"
```

### Testing Queries

```python
from sqlmodel import select

def test_query_todos_by_user(session):
    """Test querying todos for specific user"""
    # Arrange
    user_id = "user-1"
    todo1 = Todo(title="Todo 1", user_id=user_id)
    todo2 = Todo(title="Todo 2", user_id="user-2")
    session.add(todo1)
    session.add(todo2)
    session.commit()

    # Act
    statement = select(Todo).where(Todo.user_id == user_id)
    todos = session.exec(statement).all()

    # Assert
    assert len(todos) == 1
    assert todos[0].title == "Todo 1"
```

### Testing Relationships

```python
def test_user_todos_relationship(session):
    """Test user-todos relationship"""
    # Arrange
    user = User(email="test@example.com", name="Test User")
    session.add(user)
    session.commit()

    todo1 = Todo(title="Todo 1", user_id=user.id)
    todo2 = Todo(title="Todo 2", user_id=user.id)
    session.add(todo1)
    session.add(todo2)
    session.commit()

    # Act
    session.refresh(user)

    # Assert
    assert len(user.todos) == 2
```

## Async Testing

### Testing Async Functions

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    """Test async function"""
    result = await async_function()
    assert result == "expected"
```

### Async Fixtures

```python
@pytest.fixture
async def async_client():
    """Async fixture for HTTP client"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_with_async_fixture(async_client):
    response = await async_client.get("/api/todos")
    assert response.status_code == 200
```

## Test Organization

### Class-Based Tests

```python
class TestTodoAPI:
    """Test suite for Todo API"""

    def test_get_todos(self, client):
        """Test getting todos"""
        response = client.get("/api/todos")
        assert response.status_code == 200

    def test_create_todo(self, client):
        """Test creating todo"""
        response = client.post("/api/todos", json={"title": "Test"})
        assert response.status_code == 201

class TestTodoValidation:
    """Test suite for todo validation"""

    @pytest.mark.parametrize("title,valid", [
        ("", False),
        ("Test", True),
        ("a" * 201, False),
    ])
    def test_title_validation(self, title, valid):
        result = validate_title(title)
        assert result == valid
```

## Coverage Patterns

### Exclude from Coverage

```python
# pragma: no cover
if TYPE_CHECKING:
    from typing import Optional

# pragma: no cover
if __name__ == "__main__":
    main()
```

### Branch Coverage

```python
def get_todo_status(todo: Todo) -> str:
    """Get todo status - ensure all branches tested"""
    if todo.completed:  # Test this branch
        return "done"
    if todo.due_date and todo.due_date < datetime.now():  # Test this branch
        return "overdue"
    return "pending"  # Test this branch
```

## Best Practices

### AAA Pattern

```python
def test_create_todo():
    """Test creating a todo"""
    # Arrange
    todo_data = {"title": "Test Todo", "completed": False}

    # Act
    todo = create_todo(todo_data)

    # Assert
    assert todo.title == todo_data["title"]
    assert todo.completed == todo_data["completed"]
```

### Descriptive Test Names

```python
# Good: Describes what is tested and expected outcome
def test_create_todo_with_valid_data_returns_201():
    pass

def test_create_todo_without_title_returns_422():
    pass

# Bad: Vague and unclear
def test_todo():
    pass

def test_create():
    pass
```

### One Assertion Per Concept

```python
# Good: Testing one logical concept
def test_todo_has_required_fields():
    todo = create_todo({"title": "Test"})
    assert todo.title == "Test"
    assert todo.id is not None
    assert todo.created_at is not None

# Avoid: Testing multiple unrelated concepts
def test_todo_everything():
    todo = create_todo({"title": "Test"})
    assert todo.title == "Test"
    assert len(get_all_todos()) == 1
    assert delete_todo(todo.id) == True
```

### Use Fixtures for Setup

```python
# Good: Setup in fixture
@pytest.fixture
def todo(session):
    todo = Todo(title="Test")
    session.add(todo)
    session.commit()
    return todo

def test_update_todo(todo, session):
    todo.title = "Updated"
    session.commit()
    assert todo.title == "Updated"

# Avoid: Setup in each test
def test_update_todo(session):
    # Duplicated setup
    todo = Todo(title="Test")
    session.add(todo)
    session.commit()

    todo.title = "Updated"
    session.commit()
    assert todo.title == "Updated"
```
