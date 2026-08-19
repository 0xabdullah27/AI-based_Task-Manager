# Red Phase Patterns

Writing tests that fail for the right reason.

## Core Principle

**The test must fail because the feature doesn't exist yet, not because of syntax errors or wrong expectations.**

---

## Frontend (Jest/React) Patterns

### Pattern 1: Component Doesn't Exist

```typescript
// Test for non-existent component
import { render, screen } from '@testing-library/react';
import { TodoList } from '@/components/TodoList';

describe('TodoList', () => {
  it('should render empty state when no todos exist', () => {
    render(<TodoList todos={[]} />);
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });
});

// Expected failure: Module '@/components/TodoList' not found
```

### Pattern 2: Function Doesn't Exist

```typescript
// Test for non-existent function
import { calculateCompletionRate } from '@/utils/todoUtils';

describe('calculateCompletionRate', () => {
  it('should return 0% when no todos exist', () => {
    expect(calculateCompletionRate([])).toBe(0);
  });

  it('should return 100% when all todos completed', () => {
    const todos = [
      { id: 1, completed: true },
      { id: 2, completed: true },
    ];
    expect(calculateCompletionRate(todos)).toBe(100);
  });
});

// Expected failure: calculateCompletionRate is not defined
```

### Pattern 3: API Hook Doesn't Exist

```typescript
// Test for non-existent hook
import { renderHook, waitFor } from '@testing-library/react';
import { useTodos } from '@/hooks/useTodos';

describe('useTodos', () => {
  it('should fetch todos on mount', async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.todos).toBeDefined();
  });
});

// Expected failure: Module '@/hooks/useTodos' not found
```

### Pattern 4: Event Handler Doesn't Exist

```typescript
// Test for non-existent handler
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoItem } from '@/components/TodoItem';

describe('TodoItem', () => {
  it('should call onToggle when checkbox clicked', () => {
    const mockToggle = jest.fn();
    const todo = { id: 1, title: 'Test', completed: false };

    render(<TodoItem todo={todo} onToggle={mockToggle} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockToggle).toHaveBeenCalledWith(1);
  });
});

// Expected failure: Property 'onToggle' does not exist
```

---

## Backend (pytest/FastAPI) Patterns

### Pattern 1: Endpoint Doesn't Exist

```python
# Test for non-existent endpoint
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_todos_returns_empty_list():
    """GET /todos should return empty list when no todos exist."""
    response = client.get("/api/todos")
    assert response.status_code == 200
    assert response.json() == []

# Expected failure: 404 Not Found (endpoint doesn't exist)
```

### Pattern 2: Model Doesn't Exist

```python
# Test for non-existent model
from app.models.todo import Todo

def test_todo_model_creation():
    """Todo model should validate required fields."""
    todo = Todo(
        title="Test Todo",
        description="Test description",
        completed=False
    )
    assert todo.title == "Test Todo"
    assert todo.completed is False

# Expected failure: ImportError: cannot import name 'Todo'
```

### Pattern 3: Service Function Doesn't Exist

```python
# Test for non-existent service
from app.services.todo_service import get_user_todos

def test_get_user_todos_filters_by_user():
    """Service should return only user's todos."""
    user_id = 1
    todos = get_user_todos(user_id)
    assert all(todo.user_id == user_id for todo in todos)

# Expected failure: ImportError: cannot import name 'get_user_todos'
```

### Pattern 4: Validation Doesn't Exist

```python
# Test for non-existent validation
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_todo_validates_title():
    """POST /todos should reject empty title."""
    response = client.post("/api/todos", json={
        "title": "",
        "description": "Test"
    })
    assert response.status_code == 422
    assert "title" in response.json()["detail"][0]["loc"]

# Expected failure: Validation not implemented (accepts empty title)
```

---

## Good Red Phase Characteristics

### 1. Test is Well-Written

```python
# GOOD: Clear, focused test
def test_complete_todo_marks_completed():
    """Completing a todo should set completed=True."""
    todo = Todo(id=1, title="Test", completed=False)
    completed_todo = complete_todo(todo.id)
    assert completed_todo.completed is True

# BAD: Vague, unclear test
def test_todo_stuff():
    """Test todo things."""
    result = do_stuff()
    assert result
```

### 2. Failure is Expected

```typescript
// GOOD: Test expects specific behavior
it('should throw error for invalid todo ID', () => {
  expect(() => getTodoById(-1)).toThrow('Invalid todo ID');
});

// BAD: Test expects anything
it('should do something', () => {
  const result = doSomething();
  expect(result).toBeTruthy(); // Too vague
});
```

### 3. Test is Independent

```python
# GOOD: Test sets up own data
def test_delete_todo_removes_from_database():
    # Setup
    todo = create_test_todo()

    # Execute
    delete_todo(todo.id)

    # Assert
    assert get_todo(todo.id) is None

# BAD: Test depends on previous tests
def test_delete_todo():
    # Assumes todo from previous test exists
    delete_todo(1)
    assert get_todo(1) is None
```

---

## Common Red Phase Mistakes

### Mistake 1: Test Passes Immediately

```typescript
// MISTAKE: Test doesn't actually use the new code
it('should validate email', () => {
  expect(true).toBe(true); // Always passes!
});

// FIX: Actually call the code that doesn't exist
it('should validate email', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});
```

### Mistake 2: Syntax Error Instead of Logical Failure

```python
# MISTAKE: Typo in test
def test_add_todo():
    result = add_todo(title="Test")
    assert result.titl == "Test"  # Typo: 'titl' instead of 'title'

# FIX: Correct test that fails for right reason
def test_add_todo():
    result = add_todo(title="Test")
    assert result.title == "Test"  # Fails because add_todo doesn't exist
```

### Mistake 3: Testing Implementation Instead of Behavior

```typescript
// MISTAKE: Testing internal implementation
it('should use fetch to get todos', () => {
  const spy = jest.spyOn(window, 'fetch');
  getTodos();
  expect(spy).toHaveBeenCalled();
});

// FIX: Test behavior/outcome
it('should return list of todos', async () => {
  const todos = await getTodos();
  expect(Array.isArray(todos)).toBe(true);
});
```

---

## Red Phase Checklist

Before proceeding to GREEN phase:

- [ ] Test is written and executable
- [ ] Test fails with expected error message
- [ ] Failure is due to missing code, not syntax error
- [ ] Test is focused on one behavior
- [ ] Test is independent (doesn't rely on other tests)
- [ ] Test has clear assertion
- [ ] Error message helps understand what's missing
- [ ] Committed with "red: ..." message

---

## TDD Red Phase Mindset

**What you're thinking**: "If this feature existed and worked correctly, how would I verify it?"

**What you're NOT thinking**: "How will I implement this?"

The red phase is about defining success criteria, not solving the problem.

---

## Example Full Red Phase

### Frontend Example

```typescript
// File: __tests__/components/TodoForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TodoForm } from '@/components/TodoForm';

describe('TodoForm', () => {
  it('should submit new todo when form is valid', async () => {
    const mockOnSubmit = jest.fn();

    render(<TodoForm onSubmit={mockOnSubmit} />);

    // Fill form
    const titleInput = screen.getByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(titleInput, { target: { value: 'New Todo' } });
    fireEvent.change(descInput, { target: { value: 'Description' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Todo',
        description: 'Description',
      });
    });
  });

  it('should show error when title is empty', async () => {
    render(<TodoForm onSubmit={jest.fn()} />);

    const submitButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });
});
```

**Expected Failures**:
```
Module '@/components/TodoForm' not found
```

### Backend Example

```python
# File: tests/api/test_todos.py

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_todo_success():
    """POST /api/todos should create new todo."""
    payload = {
        "title": "New Todo",
        "description": "Test description",
        "completed": False
    }

    response = client.post("/api/todos", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert "id" in data
    assert "created_at" in data

def test_create_todo_requires_authentication():
    """POST /api/todos should return 401 without auth token."""
    response = client.post("/api/todos", json={"title": "Test"})
    assert response.status_code == 401

def test_create_todo_validates_title():
    """POST /api/todos should reject empty title."""
    response = client.post("/api/todos", json={
        "title": "",
        "description": "Test"
    })
    assert response.status_code == 422
```

**Expected Failures**:
```
404 Not Found: /api/todos endpoint doesn't exist
```

---

## Anti-Patterns to Avoid

### 1. Writing Multiple Features at Once

```python
# BAD: Too much in one test
def test_todo_crud():
    # Create
    todo = create_todo("Test")
    # Read
    found = get_todo(todo.id)
    # Update
    updated = update_todo(todo.id, title="Updated")
    # Delete
    delete_todo(todo.id)

# GOOD: One behavior per test
def test_create_todo():
    todo = create_todo("Test")
    assert todo.title == "Test"
```

### 2. Mocking Too Much

```typescript
// BAD: Mocking everything
it('should get todos', () => {
  const mockFetch = jest.fn().mockResolvedValue({ json: () => [] });
  const mockComponent = jest.fn();
  // Test becomes meaningless
});

// GOOD: Test real integration
it('should get todos', async () => {
  const todos = await getTodos();
  expect(Array.isArray(todos)).toBe(true);
});
```

### 3. Testing Framework, Not Code

```python
# BAD: Testing pytest, not your code
def test_something():
    assert 1 + 1 == 2  # Tests Python, not your code

# GOOD: Test your actual code
def test_something():
    result = your_function()
    assert result == expected_value
```
