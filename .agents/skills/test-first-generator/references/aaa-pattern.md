# AAA Pattern - Arrange, Act, Assert

The AAA (Arrange-Act-Assert) pattern is a standard way to structure unit tests for clarity and maintainability.

## Overview

Every test should follow three distinct phases:

1. **Arrange**: Set up test data, mocks, and preconditions
2. **Act**: Execute the code under test
3. **Assert**: Verify the expected outcome

## Basic Structure

### TypeScript/Jest Example

```typescript
test('should create a todo', () => {
  // Arrange
  const todoData = {
    title: 'Test Todo',
    completed: false,
  };

  // Act
  const todo = createTodo(todoData);

  // Assert
  expect(todo).toEqual(expect.objectContaining(todoData));
  expect(todo.id).toBeDefined();
});
```

### Python/pytest Example

```python
def test_create_todo():
    """Test creating a todo"""
    # Arrange
    todo_data = {
        "title": "Test Todo",
        "completed": False
    }

    # Act
    todo = create_todo(todo_data)

    # Assert
    assert todo.title == todo_data["title"]
    assert todo.completed == todo_data["completed"]
    assert todo.id is not None
```

## Arrange Phase

Set up everything needed for the test:

### Test Data

```typescript
// Arrange
const user = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
};

const todo = {
  title: 'Test Todo',
  completed: false,
  userId: user.id,
};
```

### Mocks and Stubs

```typescript
// Arrange
const mockFetchTodos = jest.fn().mockResolvedValue([
  { id: '1', title: 'First', completed: false },
  { id: '2', title: 'Second', completed: true },
]);

const mockOnClick = jest.fn();
```

### Component/Object Creation

```typescript
// Arrange
const component = render(<TodoList todos={mockTodos} onToggle={mockOnToggle} />);
```

### Database Setup

```python
# Arrange
@pytest.fixture
def todo_in_db(session):
    todo = Todo(title="Test Todo", user_id="user-1")
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo
```

## Act Phase

Execute the single action being tested:

### Function Call

```typescript
// Act
const result = calculateTotal(items);
```

### User Interaction

```typescript
// Act
await userEvent.click(screen.getByRole('button', { name: /add/i }));
```

### API Call

```typescript
// Act
const response = await client.post('/api/todos', { json: todoData });
```

### State Change

```typescript
// Act
await userEvent.type(screen.getByRole('textbox'), 'New Todo');
```

## Assert Phase

Verify the expected outcomes:

### Return Value Assertions

```typescript
// Assert
expect(result).toBe(10);
expect(result).toEqual(expectedObject);
expect(result).toHaveLength(3);
```

### UI Assertions

```typescript
// Assert
expect(screen.getByText('Todo created')).toBeInTheDocument();
expect(screen.getByRole('checkbox')).toBeChecked();
```

### Mock Verification

```typescript
// Assert
expect(mockCallback).toHaveBeenCalledTimes(1);
expect(mockCallback).toHaveBeenCalledWith(expectedArgs);
```

### State Assertions

```python
# Assert
assert todo.completed is True
assert len(todos) == 2
assert todo.id is not None
```

## Complete Examples

### React Component Test

```typescript
describe('TodoList Component', () => {
  it('should toggle todo when checkbox is clicked', async () => {
    // Arrange
    const mockTodos = [
      { id: '1', title: 'Test Todo', completed: false },
    ];
    const mockOnToggle = jest.fn();
    const user = userEvent.setup();

    render(<TodoList todos={mockTodos} onToggle={mockOnToggle} />);

    // Act
    await user.click(screen.getByRole('checkbox'));

    // Assert
    expect(mockOnToggle).toHaveBeenCalledWith('1');
  });
});
```

### FastAPI Endpoint Test

```python
class TestTodoEndpoints:
    def test_create_todo_success(self, client, auth_headers):
        """Test creating a todo returns 201 with todo data"""
        # Arrange
        todo_data = {
            "title": "Test Todo",
            "completed": False
        }

        # Act
        response = client.post(
            "/api/todos",
            json=todo_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == todo_data["title"]
        assert data["completed"] == todo_data["completed"]
        assert "id" in data
        assert "createdAt" in data
```

### Database Operation Test

```python
def test_update_todo_in_database(session, todo_in_db):
    """Test updating a todo in the database"""
    # Arrange
    todo_id = todo_in_db.id
    update_data = {"title": "Updated Title", "completed": True}

    # Act
    todo = session.get(Todo, todo_id)
    todo.title = update_data["title"]
    todo.completed = update_data["completed"]
    session.commit()
    session.refresh(todo)

    # Assert
    assert todo.title == update_data["title"]
    assert todo.completed is True
```

### Hook Test

```typescript
describe('useTodos Hook', () => {
  it('should add todo to list', () => {
    // Arrange
    const { result } = renderHook(() => useTodos());
    const newTodo = { title: 'New Todo', completed: false };

    // Act
    act(() => {
      result.current.addTodo(newTodo);
    });

    // Assert
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0]).toMatchObject(newTodo);
  });
});
```

## Common Patterns

### Multiple Assertions (Same Concept)

It's acceptable to have multiple assertions if they verify the same logical concept:

```typescript
test('should create todo with all required fields', () => {
  // Arrange
  const todoData = { title: 'Test', completed: false };

  // Act
  const todo = createTodo(todoData);

  // Assert - All assertions verify "todo created correctly"
  expect(todo.id).toBeDefined();
  expect(todo.title).toBe(todoData.title);
  expect(todo.completed).toBe(todoData.completed);
  expect(todo.createdAt).toBeInstanceOf(Date);
});
```

### Separate Tests for Different Scenarios

Different scenarios should have separate tests:

```typescript
// Good: Separate tests for different scenarios
test('should create todo successfully', () => {
  // Arrange
  const validData = { title: 'Test' };

  // Act
  const todo = createTodo(validData);

  // Assert
  expect(todo).toBeDefined();
});

test('should throw error for empty title', () => {
  // Arrange
  const invalidData = { title: '' };

  // Act & Assert
  expect(() => createTodo(invalidData)).toThrow('Title is required');
});
```

### Async Operations

```typescript
test('should fetch todos from API', async () => {
  // Arrange
  const mockTodos = [{ id: '1', title: 'Test' }];
  (fetchTodos as jest.Mock).mockResolvedValue(mockTodos);

  // Act
  const todos = await getTodos();

  // Assert
  expect(todos).toEqual(mockTodos);
  expect(fetchTodos).toHaveBeenCalledTimes(1);
});
```

## Visual Separation

Use blank lines to visually separate phases:

```typescript
test('example', () => {
  // Arrange
  const data = setupData();
  const mock = setupMock();

  // Act
  const result = performAction(data);

  // Assert
  expect(result).toBe(expected);
  expect(mock).toHaveBeenCalled();
});
```

Or use comments to mark sections:

```python
def test_example():
    # Arrange
    data = setup_data()
    mock = setup_mock()

    # Act
    result = perform_action(data)

    # Assert
    assert result == expected
    assert mock.called
```

## Given-When-Then Alternative

AAA is equivalent to Given-When-Then (BDD style):

```typescript
describe('TodoList', () => {
  it('should display todos', () => {
    // Given a list of todos
    const todos = [
      { id: '1', title: 'First', completed: false },
    ];

    // When the component is rendered
    render(<TodoList todos={todos} />);

    // Then the todos are displayed
    expect(screen.getByText('First')).toBeInTheDocument();
  });
});
```

## Anti-Patterns

### Mixing Phases

```typescript
// Bad: Arrange and Act mixed together
test('bad example', () => {
  const todo = createTodo({ title: 'Test' }); // Act mixed with Arrange
  const mockFn = jest.fn(); // More arrange after act

  expect(todo.title).toBe('Test'); // Assert
});

// Good: Clear separation
test('good example', () => {
  // Arrange
  const mockFn = jest.fn();
  const todoData = { title: 'Test' };

  // Act
  const todo = createTodo(todoData);

  // Assert
  expect(todo.title).toBe('Test');
});
```

### Multiple Actions

```typescript
// Bad: Multiple actions in one test
test('bad example', () => {
  // Arrange
  const todos = [];

  // Act
  todos.push(createTodo({ title: 'First' }));
  todos.push(createTodo({ title: 'Second' }));
  const filtered = filterTodos(todos, { completed: false });

  // Assert
  expect(filtered).toHaveLength(2);
});

// Good: Split into separate tests
test('should add todo to list', () => {
  const todos = [];

  todos.push(createTodo({ title: 'First' }));

  expect(todos).toHaveLength(1);
});

test('should filter incomplete todos', () => {
  const todos = [
    createTodo({ title: 'First', completed: false }),
    createTodo({ title: 'Second', completed: true }),
  ];

  const filtered = filterTodos(todos, { completed: false });

  expect(filtered).toHaveLength(1);
});
```

### Excessive Setup

```typescript
// Bad: Too much setup obscures the test
test('bad example', () => {
  // Arrange - Too much!
  const user = createUser();
  const category = createCategory();
  const tags = createTags();
  const todo = createTodo();
  // ... 20 more lines of setup

  // Act
  const result = doSomething(todo);

  // Assert
  expect(result).toBe(true);
});

// Good: Move setup to fixtures/helpers
test('good example', () => {
  // Arrange
  const todo = createTestTodo(); // Helper function

  // Act
  const result = doSomething(todo);

  // Assert
  expect(result).toBe(true);
});
```

## Benefits of AAA Pattern

1. **Clarity**: Easy to understand what the test does
2. **Maintainability**: Easy to update when requirements change
3. **Debuggability**: Easy to locate problems when tests fail
4. **Consistency**: Standardized structure across all tests
5. **Documentation**: Tests serve as clear usage examples

## Summary Checklist

- [ ] Arrange: Set up all preconditions and test data
- [ ] Act: Perform the single action being tested
- [ ] Assert: Verify all expected outcomes
- [ ] Visual separation between phases (blank lines or comments)
- [ ] One logical action per test
- [ ] Related assertions grouped together
- [ ] Clear, descriptive test name
