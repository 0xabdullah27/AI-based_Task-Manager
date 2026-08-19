# TDD Best Practices

Principles and patterns for effective Test-Driven Development.

## Core TDD Principles

### 1. Three Laws of TDD

**Law 1**: You must write a failing test before writing any production code.

**Law 2**: You must not write more of a test than is sufficient to fail (compilation counts as failure).

**Law 3**: You must not write more production code than is sufficient to pass the failing test.

### 2. Red-Green-Refactor Rhythm

```
RED: Write failing test (30 seconds - 2 minutes)
  ↓
GREEN: Make it pass (1 - 10 minutes)
  ↓
REFACTOR: Clean up (1 - 5 minutes)
  ↓
Repeat
```

**Timing Guidelines**:
- If RED takes >5 minutes: Test is too big, break it down
- If GREEN takes >15 minutes: Implementation is too complex, simplify
- If REFACTOR takes >10 minutes: Save some for next cycle

### 3. Test First, Code Second

**Always**:
```
1. Think about WHAT you need (test)
2. Then think about HOW to implement (code)
```

**Never**:
```
1. Write implementation
2. Try to test it afterward
```

---

## Writing Good Tests

### Characteristics of Good Tests

1. **Fast** - Runs in milliseconds
2. **Independent** - No dependencies on other tests
3. **Repeatable** - Same result every time
4. **Self-Validating** - Pass or fail, no manual inspection
5. **Timely** - Written before production code

### Test Structure: AAA Pattern

```python
def test_example():
    # ARRANGE: Set up test data
    todo = Todo(id=1, title="Test", completed=False)

    # ACT: Execute the behavior
    result = mark_completed(todo)

    # ASSERT: Verify the outcome
    assert result.completed is True
```

```typescript
it('should mark todo as completed', () => {
  // Arrange
  const todo = { id: 1, title: 'Test', completed: false };

  // Act
  const result = markCompleted(todo);

  // Assert
  expect(result.completed).toBe(true);
});
```

### Test Naming Conventions

**Pattern**: `test_<what>_<condition>_<expected>`

```python
# Good names
def test_create_todo_with_valid_data_returns_todo():
def test_create_todo_with_empty_title_raises_error():
def test_get_user_todos_filters_by_user_id():

# Bad names
def test_todo():
def test_1():
def test_create():
```

**Pattern (Jest/TypeScript)**: `should <expected> when <condition>`

```typescript
// Good names
it('should create todo when data is valid')
it('should throw error when title is empty')
it('should filter todos by user ID')

// Bad names
it('works')
it('test 1')
it('creates')
```

---

## Test Coverage Guidelines

### Coverage Targets

| Type | Minimum | Target | Note |
|------|---------|--------|------|
| Unit Tests | 70% | 80%+ | Core business logic |
| Integration Tests | 50% | 60%+ | API endpoints |
| E2E Tests | 30% | 40%+ | Critical paths |

### What to Test

**Always Test**:
- Business logic
- Data validation
- Error handling
- Edge cases
- Boundary conditions
- State changes

**Consider Testing**:
- Complex algorithms
- Data transformations
- Integration points
- User workflows

**Don't Test**:
- Framework code
- Third-party libraries
- Trivial getters/setters
- Configuration files

### Example: Comprehensive Test Coverage

```typescript
describe('TodoService', () => {
  // Happy path
  it('should create todo with valid data');

  // Validation
  it('should reject empty title');
  it('should reject title over 100 characters');
  it('should trim whitespace from title');

  // Edge cases
  it('should handle description as optional');
  it('should default completed to false');

  // Error handling
  it('should throw error for invalid user ID');
  it('should handle database connection failure');

  // State changes
  it('should increment todo count after creation');

  // Boundaries
  it('should accept title with exactly 100 characters');
  it('should accept title with exactly 1 character');
});
```

---

## Frontend Testing Best Practices

### React Testing Library Principles

1. **Test behavior, not implementation**
2. **Query by accessibility roles**
3. **Avoid testing internal state**
4. **Test user interactions**

```typescript
// GOOD: Testing user behavior
it('should show completed todos when filter clicked', () => {
  render(<TodoApp />);

  // User action
  const filterButton = screen.getByRole('button', { name: /completed/i });
  fireEvent.click(filterButton);

  // User-visible outcome
  expect(screen.getByText('Completed Todo')).toBeInTheDocument();
  expect(screen.queryByText('Active Todo')).not.toBeInTheDocument();
});

// BAD: Testing implementation details
it('should update state when filter changes', () => {
  const { result } = renderHook(() => useTodos());
  act(() => {
    result.current.setFilter('completed');
  });
  expect(result.current.filter).toBe('completed'); // Testing internal state
});
```

### Component Testing Patterns

```typescript
describe('TodoItem', () => {
  const mockTodo = {
    id: 1,
    title: 'Test Todo',
    completed: false,
  };

  it('should render todo title', () => {
    render(<TodoItem todo={mockTodo} />);
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
  });

  it('should call onToggle when checkbox clicked', () => {
    const mockToggle = jest.fn();
    render(<TodoItem todo={mockTodo} onToggle={mockToggle} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockToggle).toHaveBeenCalledWith(1);
  });

  it('should show completed style when todo completed', () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(<TodoItem todo={completedTodo} />);

    const title = screen.getByText('Test Todo');
    expect(title).toHaveStyle({ textDecoration: 'line-through' });
  });
});
```

### Hook Testing

```typescript
describe('useTodos', () => {
  it('should load todos on mount', async () => {
    const { result } = renderHook(() => useTodos());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.todos).toBeDefined();
  });

  it('should add todo optimistically', async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCount = result.current.todos.length;

    act(() => {
      result.current.addTodo({ title: 'New Todo' });
    });

    expect(result.current.todos).toHaveLength(initialCount + 1);
  });
});
```

---

## Backend Testing Best Practices

### FastAPI Testing Patterns

```python
from fastapi.testclient import TestClient

def test_get_todos_requires_authentication():
    """GET /api/todos should return 401 without token."""
    response = client.get("/api/todos")
    assert response.status_code == 401

def test_get_todos_returns_user_todos_only():
    """GET /api/todos should return only current user's todos."""
    # Create test user and todos
    user1_token = create_test_user("user1")
    user2_token = create_test_user("user2")

    create_test_todo(user1_token, "User 1 Todo")
    create_test_todo(user2_token, "User 2 Todo")

    # Get user1's todos
    response = client.get(
        "/api/todos",
        headers={"Authorization": f"Bearer {user1_token}"}
    )

    assert response.status_code == 200
    todos = response.json()
    assert len(todos) == 1
    assert todos[0]["title"] == "User 1 Todo"
```

### Database Testing

```python
import pytest
from sqlmodel import Session, create_engine

@pytest.fixture
def db_session():
    """Create test database session."""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session

    # Cleanup happens automatically

def test_create_todo_persists_to_database(db_session):
    """Creating todo should save to database."""
    todo = Todo(title="Test", user_id=1)
    db_session.add(todo)
    db_session.commit()

    # Verify in database
    retrieved = db_session.query(Todo).filter(Todo.title == "Test").first()
    assert retrieved is not None
    assert retrieved.title == "Test"
```

### Service Layer Testing

```python
def test_get_user_todos_filters_by_user():
    """Service should return only specified user's todos."""
    # Setup
    user_id = 1
    create_todo(title="User 1 Todo 1", user_id=1)
    create_todo(title="User 1 Todo 2", user_id=1)
    create_todo(title="User 2 Todo", user_id=2)

    # Execute
    todos = todo_service.get_user_todos(user_id)

    # Assert
    assert len(todos) == 2
    assert all(todo.user_id == user_id for todo in todos)

def test_complete_todo_updates_timestamp():
    """Completing todo should set completed_at timestamp."""
    # Setup
    todo = create_todo(title="Test", completed=False)

    # Execute
    result = todo_service.complete_todo(todo.id)

    # Assert
    assert result.completed is True
    assert result.completed_at is not None
    assert result.completed_at <= datetime.now()
```

---

## Common TDD Pitfalls

### Pitfall 1: Testing Implementation

```typescript
// BAD: Testing how it works
it('should use useState for todos', () => {
  const spy = jest.spyOn(React, 'useState');
  render(<TodoList />);
  expect(spy).toHaveBeenCalled();
});

// GOOD: Testing what it does
it('should display list of todos', () => {
  const todos = [{ id: 1, title: 'Test', completed: false }];
  render(<TodoList todos={todos} />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Pitfall 2: Test Interdependence

```python
# BAD: Tests depend on order
def test_1_create_todo():
    global todo_id
    todo = create_todo("Test")
    todo_id = todo.id

def test_2_get_todo():
    todo = get_todo(todo_id)  # Depends on test_1
    assert todo.title == "Test"

# GOOD: Each test independent
def test_create_todo():
    todo = create_todo("Test")
    assert todo.id is not None

def test_get_todo():
    # Setup its own data
    todo = create_todo("Test")
    retrieved = get_todo(todo.id)
    assert retrieved.title == "Test"
```

### Pitfall 3: Testing Too Much

```typescript
// BAD: Testing everything in one test
it('should handle entire todo lifecycle', () => {
  const { result } = renderHook(() => useTodos());

  // Create
  act(() => result.current.addTodo({ title: 'Test' }));

  // Read
  expect(result.current.todos).toHaveLength(1);

  // Update
  act(() => result.current.updateTodo(1, { completed: true }));

  // Delete
  act(() => result.current.deleteTodo(1));

  expect(result.current.todos).toHaveLength(0);
});

// GOOD: One behavior per test
it('should add todo when addTodo called', () => {
  const { result } = renderHook(() => useTodos());

  act(() => result.current.addTodo({ title: 'Test' }));

  expect(result.current.todos).toHaveLength(1);
});
```

### Pitfall 4: Brittle Tests

```typescript
// BAD: Breaks when CSS classes change
it('should have correct classes', () => {
  render(<TodoItem todo={mockTodo} />);
  const element = document.querySelector('.todo-item-wrapper');
  expect(element.className).toBe('todo-item-wrapper flex items-center');
});

// GOOD: Tests behavior, not styling
it('should render todo item', () => {
  render(<TodoItem todo={mockTodo} />);
  expect(screen.getByText(mockTodo.title)).toBeInTheDocument();
});
```

---

## Test Organization

### File Structure

```
Frontend:
src/
  components/
    TodoList.tsx
    __tests__/
      TodoList.test.tsx
  hooks/
    useTodos.ts
    __tests__/
      useTodos.test.ts
  utils/
    todoUtils.ts
    __tests__/
      todoUtils.test.ts

Backend:
app/
  api/
    todos.py
  models/
    todo.py
  services/
    todo_service.py
tests/
  api/
    test_todos.py
  models/
    test_todo.py
  services/
    test_todo_service.py
```

### Test Organization Patterns

```typescript
// Group related tests
describe('TodoList', () => {
  describe('rendering', () => {
    it('should render empty state');
    it('should render todo items');
    it('should render loading state');
  });

  describe('interactions', () => {
    it('should toggle todo on checkbox click');
    it('should delete todo on button click');
  });

  describe('filtering', () => {
    it('should show all todos by default');
    it('should filter completed todos');
    it('should filter active todos');
  });
});
```

---

## TDD Workflow Tips

### Starting a New Feature

1. **Read specification** - Understand requirements
2. **Identify acceptance criteria** - What defines success?
3. **Write first test** - Start with simplest case
4. **See it fail** - Verify test is valid
5. **Implement minimally** - Make test pass
6. **Refactor** - Clean up
7. **Add next test** - Build incrementally

### When Stuck

**Problem**: Don't know what test to write next

**Solution**: Write a TODO list of test cases, pick simplest

```typescript
describe('TodoService', () => {
  // TODO: Test create with valid data
  // TODO: Test create with empty title (simpler - start here)
  // TODO: Test create with long title
  // TODO: Test create updates count
});
```

**Problem**: Test is too big to write

**Solution**: Break into smaller tests

```typescript
// Instead of:
it('should create, update, and delete todo');

// Write:
it('should create todo with valid data');
it('should update todo title');
it('should delete todo by ID');
```

**Problem**: Don't know how to implement

**Solution**: Write test anyway, let it guide you

```typescript
// Write test even if don't know implementation
it('should calculate completion percentage', () => {
  const todos = [
    { completed: true },
    { completed: false },
    { completed: true },
  ];
  expect(calculateCompletionRate(todos)).toBe(67);
});

// Test shows what function needs to do
// Implementation becomes clear
```

---

## TDD Metrics

### Healthy TDD Indicators

- Tests written before code: **100%**
- Test coverage: **≥70%**
- Test pass rate: **100%**
- Average test execution time: **<100ms per test**
- Tests per feature: **5-15** (depends on complexity)
- Red phase duration: **<2 minutes**
- Green phase duration: **<10 minutes**

### Warning Signs

- Coverage dropping over time
- Tests frequently skipped
- Long test execution times
- Tests often break together
- Frequent test rewrites
- Tests passing without code changes

---

## TDD and Constitutional Compliance

### Constitution Requirements

From `.specify/memory/constitution.md`:

**Principle I**: All features MUST be implemented using TDD

**Principle III**: Test coverage MUST be ≥70%

**Principle IV**: Tests MUST pass before code is complete

### Compliance Checklist

- [ ] Test written before implementation
- [ ] Test fails initially (RED)
- [ ] Implementation makes test pass (GREEN)
- [ ] Code refactored (REFACTOR)
- [ ] Coverage ≥70%
- [ ] All tests passing
- [ ] Git commits for each phase

---

## Quick Reference

### TDD Cycle Checklist

**RED Phase**:
- [ ] Write test for new behavior
- [ ] Test fails for expected reason
- [ ] Commit: "red: add failing test for X"

**GREEN Phase**:
- [ ] Write minimal implementation
- [ ] All tests pass
- [ ] Coverage ≥70%
- [ ] Commit: "green: implement X"

**REFACTOR Phase**:
- [ ] Improve code quality
- [ ] Tests still pass
- [ ] Coverage maintained
- [ ] Commit: "refactor: clean up X"

### Test Quality Checklist

- [ ] Fast (<100ms)
- [ ] Independent (no dependencies)
- [ ] Repeatable (deterministic)
- [ ] Self-validating (pass/fail clear)
- [ ] Timely (written first)
- [ ] Clear name
- [ ] AAA structure
- [ ] One behavior per test

---

## Resources

### Further Reading

- Kent Beck - "Test Driven Development: By Example"
- Martin Fowler - "Refactoring: Improving the Design of Existing Code"
- React Testing Library Documentation
- pytest Documentation
- FastAPI Testing Guide

### Tools

- **Frontend**: Jest, React Testing Library, Playwright
- **Backend**: pytest, pytest-cov, httpx (for FastAPI)
- **Coverage**: Jest (--coverage), pytest-cov
- **Continuous Integration**: GitHub Actions, GitLab CI

---

## Summary

**TDD is not about testing, it's about design.**

Tests drive implementation. Write tests that describe desired behavior, then implement to satisfy tests.

Follow RED-GREEN-REFACTOR rhythm consistently.

Aim for 70%+ coverage, fast tests, and clear test names.

Tests are living documentation of what code does and why.
