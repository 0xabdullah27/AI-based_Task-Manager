# Mocking Strategies

Comprehensive guide to mocking external dependencies in tests.

## Why Mock?

Mocking allows you to:

- **Isolate Unit Under Test**: Test one component without dependencies
- **Control Test Conditions**: Simulate edge cases and errors
- **Improve Test Speed**: Avoid slow network/database operations
- **Ensure Determinism**: Tests produce same results every time

## Mock vs Stub vs Spy

### Mock

A mock replaces a dependency and allows verification of interactions:

```typescript
const mockCallback = jest.fn();
component.on('click', mockCallback);

// Verify interaction
expect(mockCallback).toHaveBeenCalledWith(expectedArgs);
```

### Stub

A stub provides predetermined responses without verification:

```typescript
const stub = {
  getTodos: () => [{ id: '1', title: 'Test' }],
};
```

### Spy

A spy wraps the real implementation and records calls:

```typescript
const spy = jest.spyOn(todoService, 'getTodos');
await todoService.getTodos();

expect(spy).toHaveBeenCalled();
spy.mockRestore(); // Restore original
```

## Mocking APIs

### MSW (Mock Service Worker) - Recommended

MSW intercepts network requests at the network level:

```typescript
// mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // GET request
  rest.get('/api/todos', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', title: 'First Todo', completed: false },
        { id: '2', title: 'Second Todo', completed: true },
      ])
    );
  }),

  // POST request
  rest.post('/api/todos', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({ ...body, id: '3', createdAt: new Date().toISOString() })
    );
  }),

  // Error response
  rest.get('/api/todos/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    );
  }),

  // Delayed response
  rest.get('/api/todos/slow', (req, res, ctx) => {
    return res(ctx.delay(2000), ctx.json([]));
  }),
];

// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// jest.setup.js
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Override Handlers Per Test

```typescript
import { rest } from 'msw';
import { server } from '@/mocks/server';

test('handles 404 error', async () => {
  // Override for this test only
  server.use(
    rest.get('/api/todos/:id', (req, res, ctx) => {
      return res(ctx.status(404), ctx.json({ error: 'Not found' }));
    })
  );

  render(<TodoDetail id="999" />);

  expect(await screen.findByText(/not found/i)).toBeInTheDocument();
});
```

### Request Matching

```typescript
// Match path parameters
rest.get('/api/todos/:id', (req, res, ctx) => {
  const { id } = req.params;
  return res(ctx.json({ id, title: `Todo ${id}` }));
});

// Match query parameters
rest.get('/api/todos', (req, res, ctx) => {
  const completed = req.url.searchParams.get('completed');
  const todos = mockTodos.filter((t) => t.completed === (completed === 'true'));
  return res(ctx.json(todos));
});

// Match request body
rest.post('/api/todos', async (req, res, ctx) => {
  const body = await req.json();
  if (!body.title) {
    return res(ctx.status(422), ctx.json({ error: 'Title required' }));
  }
  return res(ctx.status(201), ctx.json({ ...body, id: '1' }));
});

// Match headers
rest.get('/api/todos', (req, res, ctx) => {
  const token = req.headers.get('Authorization');
  if (!token) {
    return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
  }
  return res(ctx.json(mockTodos));
});
```

### Jest Module Mocking

```typescript
// Mock entire module
jest.mock('@/lib/api', () => ({
  fetchTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
}));

// Use mocks in tests
import { fetchTodos, createTodo } from '@/lib/api';

test('fetches todos', async () => {
  (fetchTodos as jest.Mock).mockResolvedValue([
    { id: '1', title: 'Test' },
  ]);

  const result = await getTodos();

  expect(fetchTodos).toHaveBeenCalled();
  expect(result).toHaveLength(1);
});

test('creates todo', async () => {
  const newTodo = { title: 'New', completed: false };
  (createTodo as jest.Mock).mockResolvedValue({ ...newTodo, id: '1' });

  const result = await addTodo(newTodo);

  expect(createTodo).toHaveBeenCalledWith(newTodo);
  expect(result.id).toBe('1');
});
```

## Mocking Database

### In-Memory Database (SQLite)

```python
# conftest.py
import pytest
from sqlmodel import Session, create_engine, SQLModel
from sqlalchemy.pool import StaticPool

@pytest.fixture(name="session")
def session_fixture():
    """Create in-memory database for testing"""
    # Use SQLite in-memory database
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session

    # Cleanup happens automatically with in-memory DB
```

### Mocking Session

```python
from unittest.mock import MagicMock
import pytest

@pytest.fixture
def mock_session():
    """Mock database session"""
    session = MagicMock(spec=Session)
    return session

def test_create_todo_with_mock(mock_session):
    """Test creating todo with mocked session"""
    # Arrange
    todo_data = {"title": "Test Todo"}
    todo_service = TodoService(mock_session)

    # Act
    todo = todo_service.create_todo(todo_data)

    # Assert
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()
```

### Database Fixtures

```python
@pytest.fixture
def user(session):
    """Create a user in test database"""
    user = User(email="test@example.com", name="Test User")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@pytest.fixture
def todos(session, user):
    """Create multiple todos for testing"""
    todos = [
        Todo(title="First", user_id=user.id),
        Todo(title="Second", user_id=user.id, completed=True),
    ]
    for todo in todos:
        session.add(todo)
    session.commit()
    return todos

def test_get_user_todos(session, user, todos):
    """Test getting todos for a user"""
    result = session.exec(
        select(Todo).where(Todo.user_id == user.id)
    ).all()

    assert len(result) == 2
```

## Mocking Authentication

### JWT Token Mocking

```typescript
// Mock auth token generation
jest.mock('@/lib/auth', () => ({
  getToken: jest.fn().mockReturnValue('mock-token-123'),
  verifyToken: jest.fn().mockReturnValue({ userId: 'user-1' }),
}));

// Test with auth
test('makes authenticated request', async () => {
  const { getToken } = require('@/lib/auth');

  render(<TodoList />);

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token-123',
        }),
      })
    );
  });
});
```

### Mock User Session

```typescript
// Mock session provider
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

import { useSession } from 'next-auth/react';

test('renders for authenticated user', () => {
  // Mock authenticated session
  (useSession as jest.Mock).mockReturnValue({
    data: {
      user: { id: '1', email: 'test@example.com' },
    },
    status: 'authenticated',
  });

  render(<TodoList />);

  expect(screen.getByText(/my todos/i)).toBeInTheDocument();
});

test('redirects unauthenticated user', () => {
  // Mock unauthenticated session
  (useSession as jest.Mock).mockReturnValue({
    data: null,
    status: 'unauthenticated',
  });

  render(<TodoList />);

  expect(mockRouter.push).toHaveBeenCalledWith('/login');
});
```

### FastAPI Auth Dependency Override

```python
from fastapi import Depends
from app.auth import get_current_user

# Test fixture to override auth
@pytest.fixture
def auth_headers():
    """Provide valid auth headers"""
    token = create_test_token(user_id="user-1")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def override_get_current_user():
    """Override auth dependency"""
    def mock_get_current_user():
        return User(id="user-1", email="test@example.com")

    app.dependency_overrides[get_current_user] = mock_get_current_user
    yield
    app.dependency_overrides.clear()

def test_protected_endpoint(client, override_get_current_user):
    """Test endpoint with auth override"""
    response = client.get("/api/todos")
    assert response.status_code == 200
```

## Mocking Time

### Jest Timer Mocks

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('debounces input', () => {
  const mockCallback = jest.fn();
  const { result } = renderHook(() => useDebounce(mockCallback, 500));

  // Trigger multiple times
  result.current('a');
  result.current('ab');
  result.current('abc');

  // Advance time by 500ms
  jest.advanceTimersByTime(500);

  // Should only call once with final value
  expect(mockCallback).toHaveBeenCalledTimes(1);
  expect(mockCallback).toHaveBeenCalledWith('abc');
});
```

### Mock Date

```typescript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

test('shows correct due date', () => {
  const todo = {
    title: 'Test',
    dueDate: new Date('2024-01-02T00:00:00.000Z'),
  };

  render(<TodoItem todo={todo} />);

  expect(screen.getByText(/due tomorrow/i)).toBeInTheDocument();
});
```

### Python Time Mocking

```python
from unittest.mock import patch
from datetime import datetime

@patch('app.utils.datetime')
def test_with_mocked_time(mock_datetime):
    """Test with fixed time"""
    # Set fixed time
    mock_datetime.now.return_value = datetime(2024, 1, 1, 0, 0, 0)

    # Test code that uses datetime.now()
    result = get_due_status(todo)

    assert result == "due_today"
```

## Mocking External Services

### Email Service Mock

```python
from unittest.mock import patch

@patch('app.services.email.send_email')
def test_sends_email(mock_send_email):
    """Test email sending"""
    # Arrange
    user = User(email="test@example.com")
    mock_send_email.return_value = True

    # Act
    result = notify_user(user, "Welcome!")

    # Assert
    mock_send_email.assert_called_once_with(
        to="test@example.com",
        subject="Welcome!",
        body=expect.any(str)
    )
```

### File System Mock

```typescript
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

import { readFile, writeFile } from 'fs/promises';

test('reads config file', async () => {
  (readFile as jest.Mock).mockResolvedValue('{"theme": "dark"}');

  const config = await loadConfig();

  expect(config.theme).toBe('dark');
});
```

## Partial Mocking

### Mock Some Methods, Keep Others

```typescript
import * as api from '@/lib/api';

jest.spyOn(api, 'fetchTodos').mockResolvedValue([]);
// Other methods in api module work normally

test('uses real and mock methods', async () => {
  await api.fetchTodos(); // Mocked
  await api.fetchUser(); // Real implementation
});
```

### Mock Implementation Once

```typescript
const mockFn = jest.fn()
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');

expect(mockFn()).toBe('first');
expect(mockFn()).toBe('second');
expect(mockFn()).toBe('default');
expect(mockFn()).toBe('default');
```

## Mock Verification

### Call Verification

```typescript
const mock = jest.fn();

// Check if called
expect(mock).toHaveBeenCalled();
expect(mock).not.toHaveBeenCalled();

// Check call count
expect(mock).toHaveBeenCalledTimes(2);

// Check arguments
expect(mock).toHaveBeenCalledWith(arg1, arg2);
expect(mock).toHaveBeenLastCalledWith(arg1, arg2);
expect(mock).toHaveBeenNthCalledWith(1, arg1);

// Check all calls
expect(mock.mock.calls).toEqual([
  [arg1, arg2],
  [arg3, arg4],
]);
```

### Return Value Verification

```typescript
const mock = jest.fn()
  .mockReturnValue('result');

mock();

expect(mock).toHaveReturned();
expect(mock).toHaveReturnedTimes(1);
expect(mock).toHaveReturnedWith('result');
```

## Best Practices

### Mock at the Right Level

```typescript
// Good: Mock at the boundary (API calls)
jest.mock('@/lib/api');

// Avoid: Mocking internal functions
jest.mock('@/lib/utils/formatDate'); // Too granular
```

### Keep Mocks Simple

```typescript
// Good: Simple, focused mock
const mockTodo = {
  id: '1',
  title: 'Test',
  completed: false,
};

// Avoid: Overly complex mock with everything
const mockTodo = {
  id: '1',
  title: 'Test',
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { /* ... */ },
  tags: [/* ... */],
  // ... 20 more fields
};
```

### Reset Mocks Between Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clear call history
  // or
  jest.resetAllMocks(); // Clear history and implementation
});
```

### Use Type-Safe Mocks

```typescript
import { createTodo } from '@/lib/api';

// Type-safe mock casting
const mockCreateTodo = createTodo as jest.MockedFunction<typeof createTodo>;

mockCreateTodo.mockResolvedValue({ id: '1', title: 'Test' });
```

### Document Mock Behavior

```typescript
test('handles server error', async () => {
  // Mock API to return 500 error for this test
  server.use(
    rest.get('/api/todos', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    })
  );

  render(<TodoList />);

  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

## Summary

Choose the right mocking strategy:

- **MSW**: Mock HTTP requests (API calls)
- **jest.mock**: Mock modules and dependencies
- **In-memory DB**: Mock database (SQLite for tests)
- **Fixtures**: Create test data
- **jest.fn()**: Mock callbacks and simple functions
- **jest.spyOn()**: Spy on real implementations

Always mock at boundaries (API, database, external services) and keep mocks simple and focused.
