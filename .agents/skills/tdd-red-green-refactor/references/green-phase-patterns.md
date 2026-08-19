# Green Phase Patterns

Writing minimal code to make tests pass.

## Core Principle

**Write the simplest code that makes the test pass. No more, no less.**

---

## Green Phase Mindset

**Focus**: Make the red test pass with minimal, straightforward code.

**Avoid**:
- Extra features not covered by tests
- Premature optimization
- Complex abstractions
- "While I'm here" changes

**Remember**: You can improve it in the REFACTOR phase.

---

## Frontend (React/TypeScript) Patterns

### Pattern 1: Simple Component

**Test (Red)**:
```typescript
it('should render todo title', () => {
  const todo = { id: 1, title: 'Test Todo', completed: false };
  render(<TodoItem todo={todo} />);
  expect(screen.getByText('Test Todo')).toBeInTheDocument();
});
```

**Minimal Implementation (Green)**:
```typescript
// components/TodoItem.tsx
interface TodoItemProps {
  todo: {
    id: number;
    title: string;
    completed: boolean;
  };
}

export function TodoItem({ todo }: TodoItemProps) {
  return <div>{todo.title}</div>;
}
```

**Don't add**:
- Styling
- Additional fields
- Complex structure
- Extra functionality

### Pattern 2: Event Handler

**Test (Red)**:
```typescript
it('should call onToggle when clicked', () => {
  const mockToggle = jest.fn();
  const todo = { id: 1, title: 'Test', completed: false };

  render(<TodoItem todo={todo} onToggle={mockToggle} />);

  const checkbox = screen.getByRole('checkbox');
  fireEvent.click(checkbox);

  expect(mockToggle).toHaveBeenCalledWith(1);
});
```

**Minimal Implementation (Green)**:
```typescript
interface TodoItemProps {
  todo: {
    id: number;
    title: string;
    completed: boolean;
  };
  onToggle: (id: number) => void;
}

export function TodoItem({ todo, onToggle }: TodoItemProps) {
  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      {todo.title}
    </div>
  );
}
```

### Pattern 3: Custom Hook

**Test (Red)**:
```typescript
it('should fetch todos on mount', async () => {
  const { result } = renderHook(() => useTodos());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.todos).toEqual([]);
});
```

**Minimal Implementation (Green)**:
```typescript
// hooks/useTodos.ts
import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Minimal fetch
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => {
        setTodos(data);
        setIsLoading(false);
      });
  }, []);

  return { todos, isLoading };
}
```

### Pattern 4: Form Validation

**Test (Red)**:
```typescript
it('should show error when title is empty', async () => {
  render(<TodoForm onSubmit={jest.fn()} />);

  const submitButton = screen.getByRole('button', { name: /add/i });
  fireEvent.click(submitButton);

  expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
});
```

**Minimal Implementation (Green)**:
```typescript
import { useState } from 'react';

export function TodoForm({ onSubmit }: { onSubmit: (todo: any) => void }) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    onSubmit({ title });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="title"
      />
      {error && <div>{error}</div>}
      <button type="submit">Add</button>
    </form>
  );
}
```

---

## Backend (FastAPI/Python) Patterns

### Pattern 1: Simple Endpoint

**Test (Red)**:
```python
def test_get_todos_returns_empty_list():
    response = client.get("/api/todos")
    assert response.status_code == 200
    assert response.json() == []
```

**Minimal Implementation (Green)**:
```python
# app/main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/todos")
def get_todos():
    return []
```

### Pattern 2: Create Endpoint

**Test (Red)**:
```python
def test_create_todo_success():
    payload = {
        "title": "New Todo",
        "description": "Test",
        "completed": False
    }

    response = client.post("/api/todos", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert "id" in data
```

**Minimal Implementation (Green)**:
```python
# app/models/todo.py
from pydantic import BaseModel

class TodoCreate(BaseModel):
    title: str
    description: str
    completed: bool = False

class TodoResponse(BaseModel):
    id: int
    title: str
    description: str
    completed: bool

# app/main.py
from fastapi import FastAPI, status
from app.models.todo import TodoCreate, TodoResponse

app = FastAPI()
todos_db = []
next_id = 1

@app.post("/api/todos", status_code=status.HTTP_201_CREATED)
def create_todo(todo: TodoCreate) -> TodoResponse:
    global next_id
    new_todo = TodoResponse(
        id=next_id,
        title=todo.title,
        description=todo.description,
        completed=todo.completed
    )
    todos_db.append(new_todo)
    next_id += 1
    return new_todo
```

### Pattern 3: Validation

**Test (Red)**:
```python
def test_create_todo_validates_title():
    response = client.post("/api/todos", json={
        "title": "",
        "description": "Test"
    })
    assert response.status_code == 422
```

**Minimal Implementation (Green)**:
```python
from pydantic import BaseModel, validator

class TodoCreate(BaseModel):
    title: str
    description: str
    completed: bool = False

    @validator('title')
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v
```

### Pattern 4: Database Model

**Test (Red)**:
```python
def test_todo_model_creation():
    todo = Todo(
        title="Test Todo",
        description="Test description",
        completed=False
    )
    assert todo.title == "Test Todo"
    assert todo.completed is False
```

**Minimal Implementation (Green)**:
```python
# app/models/todo.py
from sqlmodel import SQLModel, Field
from typing import Optional

class Todo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    completed: bool = False
```

### Pattern 5: Service Function

**Test (Red)**:
```python
def test_get_user_todos_filters_by_user():
    user_id = 1
    todos = get_user_todos(user_id)
    assert all(todo.user_id == user_id for todo in todos)
```

**Minimal Implementation (Green)**:
```python
# app/services/todo_service.py
from typing import List
from app.models.todo import Todo

def get_user_todos(user_id: int) -> List[Todo]:
    # Minimal: just filter by user_id
    return [todo for todo in todos_db if todo.user_id == user_id]
```

---

## Green Phase Principles

### 1. Fake It Till You Make It

Start with hardcoded values, generalize later in refactor.

```python
# Test expects specific behavior
def test_calculate_total():
    assert calculate_total([1, 2, 3]) == 6

# GREEN: Hardcode first (if it makes test pass)
def calculate_total(numbers):
    return 6  # Fake it!

# More tests will force real implementation
def test_calculate_total_different_values():
    assert calculate_total([5, 5]) == 10

# Now must implement for real
def calculate_total(numbers):
    return sum(numbers)
```

### 2. Obvious Implementation

If solution is obvious and simple, write it directly.

```typescript
// Test
it('should return uppercase string', () => {
  expect(toUpperCase('hello')).toBe('HELLO');
});

// GREEN: Obvious, so implement directly
function toUpperCase(str: string): string {
  return str.toUpperCase();
}
```

### 3. Triangulation

Use multiple test cases to force generalization.

```python
# Test 1
def test_is_even_with_two():
    assert is_even(2) == True

# GREEN: Fake it
def is_even(n):
    return True

# Test 2: Forces real implementation
def test_is_even_with_three():
    assert is_even(3) == False

# GREEN: Now must be real
def is_even(n):
    return n % 2 == 0
```

---

## Common Green Phase Mistakes

### Mistake 1: Over-Engineering

```typescript
// BAD: Too complex for simple test
class TodoManager {
  private todos: Map<number, Todo>;
  private observers: Set<Observer>;
  private strategy: TodoStrategy;

  // ... 100 lines of abstraction
}

// GOOD: Just enough to pass test
const todos: Todo[] = [];

function getTodos() {
  return todos;
}
```

### Mistake 2: Adding Untested Features

```python
# Test only checks title
def test_create_todo():
    todo = create_todo("Test")
    assert todo.title == "Test"

# BAD: Adding features not in test
def create_todo(title, description, tags, priority, due_date):
    # Too much!
    pass

# GOOD: Only what test requires
def create_todo(title):
    return Todo(title=title)
```

### Mistake 3: Premature Optimization

```typescript
// Test is simple
it('should filter completed todos', () => {
  const todos = [
    { id: 1, completed: true },
    { id: 2, completed: false },
  ];
  expect(filterCompleted(todos)).toEqual([{ id: 1, completed: true }]);
});

// BAD: Premature optimization
function filterCompleted(todos: Todo[]): Todo[] {
  // Using complex algorithm for micro-optimization
  const hashMap = new Map();
  // ... 50 lines of optimized code
}

// GOOD: Simple and clear
function filterCompleted(todos: Todo[]): Todo[] {
  return todos.filter(todo => todo.completed);
}
```

### Mistake 4: Ignoring Test Feedback

```python
# Test shows what's needed
def test_todo_has_created_at():
    todo = create_todo("Test")
    assert todo.created_at is not None

# BAD: Ignoring test requirement
def create_todo(title):
    return Todo(title=title)  # Missing created_at!

# GOOD: Listen to test
from datetime import datetime

def create_todo(title):
    return Todo(title=title, created_at=datetime.now())
```

---

## Green Phase Checklist

Before proceeding to REFACTOR:

- [ ] All tests pass
- [ ] Only code tested by current tests was added
- [ ] No extra features added
- [ ] No premature optimization
- [ ] Code is simple and straightforward
- [ ] No duplication (unless will refactor next)
- [ ] Coverage meets 70% minimum
- [ ] Committed with "green: ..." message

---

## Progressive Implementation Strategy

### Start Minimal, Grow Incrementally

```typescript
// Test 1: Basic rendering
it('should render todo list', () => {
  render(<TodoList todos={[]} />);
  expect(screen.getByRole('list')).toBeInTheDocument();
});

// GREEN 1: Minimal
function TodoList({ todos }: { todos: Todo[] }) {
  return <ul></ul>;
}

// Test 2: Show todos
it('should render todo items', () => {
  const todos = [{ id: 1, title: 'Test', completed: false }];
  render(<TodoList todos={todos} />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});

// GREEN 2: Add just enough
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}

// Test 3: Show empty state
it('should show message when empty', () => {
  render(<TodoList todos={[]} />);
  expect(screen.getByText(/no todos/i)).toBeInTheDocument();
});

// GREEN 3: Handle empty case
function TodoList({ todos }: { todos: Todo[] }) {
  if (todos.length === 0) {
    return <div>No todos yet</div>;
  }

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

---

## Type Safety in Green Phase

### TypeScript Example

```typescript
// Test defines the contract
it('should create todo with required fields', () => {
  const todo = createTodo({ title: 'Test' });
  expect(todo).toHaveProperty('id');
  expect(todo).toHaveProperty('title', 'Test');
  expect(todo).toHaveProperty('completed', false);
});

// GREEN: Types emerge from tests
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

let nextId = 1;

function createTodo({ title }: { title: string }): Todo {
  return {
    id: nextId++,
    title,
    completed: false,
  };
}
```

### Python Type Hints

```python
# Test shows expected types
def test_create_todo_returns_todo_object():
    todo = create_todo("Test")
    assert isinstance(todo, Todo)
    assert todo.id > 0
    assert todo.title == "Test"

# GREEN: Add type hints
from dataclasses import dataclass

@dataclass
class Todo:
    id: int
    title: str
    completed: bool = False

next_id = 1

def create_todo(title: str) -> Todo:
    global next_id
    todo = Todo(id=next_id, title=title)
    next_id += 1
    return todo
```

---

## When to Stop

**Stop when**:
- All tests pass
- Test expectations are met
- No more test failures

**Don't continue to**:
- Add features not tested
- Optimize performance
- Refactor structure
- Improve naming (much)

Save improvements for REFACTOR phase.

---

## Green Phase Anti-Patterns

### 1. Goldplating

```python
# Test needs simple function
def test_add_numbers():
    assert add(2, 3) == 5

# BAD: Over-engineered
class Calculator:
    def __init__(self, precision=10, rounding_mode='HALF_UP'):
        self.precision = precision
        self.rounding_mode = rounding_mode

    def add(self, a, b, validate=True, log=False):
        # 50 lines...

# GOOD: Simple
def add(a, b):
    return a + b
```

### 2. Copy-Paste from Production

```typescript
// Test for new feature
it('should format todo date', () => {
  expect(formatDate(new Date('2025-01-16'))).toBe('Jan 16, 2025');
});

// BAD: Copying complex production code
// (200 lines of date formatting with timezone logic)

// GOOD: Simple implementation
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
```

### 3. Defensive Programming Too Early

```python
# Test doesn't check error cases yet
def test_get_todo():
    todo = get_todo(1)
    assert todo.id == 1

# BAD: Adding error handling not tested
def get_todo(todo_id):
    if not isinstance(todo_id, int):
        raise TypeError("ID must be integer")
    if todo_id < 1:
        raise ValueError("ID must be positive")
    if todo_id > MAX_ID:
        raise ValueError("ID too large")
    # ... more checks

# GOOD: Just what's tested
def get_todo(todo_id):
    return todos_db.get(todo_id)
```

---

## Summary

**Green Phase Goal**: Make tests pass with simplest possible code.

**Key Principles**:
1. Minimal implementation
2. No extra features
3. No premature optimization
4. Listen to test feedback
5. Type safety from tests
6. Progressive growth

**Next**: REFACTOR phase to improve code quality while keeping tests green.
