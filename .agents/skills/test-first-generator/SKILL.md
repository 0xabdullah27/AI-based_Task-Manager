---
name: test-first-generator
description: |
  Generates test files for React components and FastAPI endpoints following TDD principles.
  This skill should be used when implementing features that require test-first development.
  Use for generating Jest tests for React components/hooks, pytest tests for FastAPI endpoints,
  and ensuring AAA pattern, test isolation, and descriptive naming conventions.
---

# Test-First Generator

Generate test files following Test-Driven Development principles for React and FastAPI applications.

## When to Use

- Before implementing any React component or hook
- Before implementing any FastAPI endpoint or service
- When starting a new feature that requires tests
- When following the Red-Green-Refactor TDD cycle
- After designing API contracts or component interfaces

## Before Implementation

Gather context to ensure successful test generation:

| Source | Gather |
|--------|--------|
| **Specification** | Functional requirements, acceptance criteria, user stories |
| **API Design** | Endpoint signatures, request/response schemas |
| **Component Design** | Props interface, component responsibilities |
| **Constitution** | TDD requirements (70% coverage minimum) |
| **Skill References** | Testing patterns from `references/` |

## Required Inputs

Before generating tests, clarify:

1. **Target Type**: Component, Hook, API Endpoint, Service, Model?
2. **Technology**: React (Jest/RTL), Python (pytest)?
3. **Test Scope**: Unit, Integration, or E2E?
4. **Dependencies**: External APIs, database, auth requirements?
5. **Edge Cases**: Error scenarios, validation failures, boundary conditions?

## Clarification Questions

When user requests test generation, ask:

### For React Components
- What are the component's props and their types?
- What user interactions need testing?
- What state changes should be verified?
- Are there any async operations (API calls, delays)?
- What accessibility requirements exist?

### For React Hooks
- What is the hook's signature (parameters and return value)?
- What state does the hook manage?
- What side effects does it trigger?
- What dependencies does it have?

### For FastAPI Endpoints
- What is the endpoint path and HTTP method?
- What are the request/response schemas?
- What authentication/authorization is required?
- What database operations occur?
- What validation rules exist?

### For Python Services
- What is the service's public interface?
- What external dependencies exist (database, APIs)?
- What business logic needs testing?
- What error scenarios should be covered?

## Test Generation Process

### Step 1: Analyze Requirements

Extract testable requirements from specification:

```
FR-007: Users can create tasks
→ Test: POST /api/todos creates a new todo
→ Test: Returns 201 with created todo data
→ Test: Validates required fields
→ Test: Returns 422 on validation failure
```

### Step 2: Identify Test Cases

For each requirement, identify:

1. **Happy Path**: Normal successful execution
2. **Edge Cases**: Boundary values, empty inputs
3. **Error Cases**: Validation failures, not found, unauthorized
4. **State Changes**: Database updates, state transitions
5. **Side Effects**: API calls, notifications, logging

### Step 3: Apply AAA Pattern

Structure each test with Arrange-Act-Assert:

```typescript
// Arrange: Set up test data and mocks
const mockTodo = { title: "Test Todo", completed: false };

// Act: Execute the code under test
const result = await createTodo(mockTodo);

// Assert: Verify the outcome
expect(result).toEqual(expect.objectContaining(mockTodo));
```

### Step 4: Generate Test File

Use appropriate template from `assets/templates/`:

- `component.test.tsx` - React component tests
- `hook.test.ts` - React hook tests
- `api.test.tsx` - API integration tests (MSW)
- `test_model.py` - SQLModel model tests
- `test_crud.py` - Database CRUD operation tests
- `test_api.py` - FastAPI endpoint tests

### Step 5: Add Descriptive Names

Follow naming conventions:

**Jest/RTL:**
```typescript
describe('TodoList Component', () => {
  describe('when user is authenticated', () => {
    it('should display list of todos', () => {});
    it('should allow creating new todo', () => {});
    it('should show error message when creation fails', () => {});
  });

  describe('when user is not authenticated', () => {
    it('should redirect to login page', () => {});
  });
});
```

**pytest:**
```python
class TestTodoAPI:
    """Test suite for Todo API endpoints"""

    def test_create_todo_success(self):
        """Test creating a todo returns 201 with todo data"""

    def test_create_todo_missing_title_returns_422(self):
        """Test creating todo without title returns validation error"""
```

## Output Format

Return generated test file with:

```markdown
## Test File: [filename]

**Test Type**: Unit / Integration / E2E
**Target**: [Component/Hook/Endpoint name]
**Framework**: Jest + React Testing Library / pytest
**Coverage Target**: [X]% (minimum 70%)

### Test Cases Covered

- [ ] Happy path: [description]
- [ ] Edge case: [description]
- [ ] Error case: [description]
- [ ] State change: [description]

### File Content

```[language]
[Generated test code]
```

### Mock Data Required

```[language]
[Mock data and fixtures]
```

### Setup Instructions

1. Install dependencies: [commands]
2. Configure test environment: [steps]
3. Run tests: [commands]
```

## Testing Standards

### Test Isolation

- Each test should be independent
- Use setup/teardown hooks appropriately
- Clear mocks between tests
- Reset database state in integration tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

```python
@pytest.fixture(autouse=True)
def reset_db(session):
    """Reset database state before each test"""
    session.rollback()
    yield
    session.rollback()
```

### Descriptive Test Names

- Use "should" or "when/then" format
- Include context in nested describes
- Be specific about expected behavior

**Good:**
```typescript
it('should display validation error when title exceeds 200 characters', () => {});
```

**Bad:**
```typescript
it('validation test', () => {});
```

### Mock External Dependencies

- Mock API calls with MSW or jest.mock
- Mock database with fixtures or in-memory DB
- Mock authentication/authorization
- Mock time-dependent operations

```typescript
// MSW for API mocking
const handlers = [
  rest.get('/api/todos', (req, res, ctx) => {
    return res(ctx.json([mockTodo1, mockTodo2]));
  }),
];
```

```python
# pytest fixtures for mocking
@pytest.fixture
def mock_session():
    """Mock database session"""
    return MagicMock(spec=Session)
```

### Assertion Quality

- Use specific matchers
- Verify both positive and negative cases
- Check error messages and types
- Verify side effects

```typescript
// Specific assertions
expect(result).toHaveLength(2);
expect(screen.getByRole('button', { name: /add todo/i })).toBeInTheDocument();
expect(mockCreateTodo).toHaveBeenCalledWith(expectedData);
```

```python
# Specific assertions
assert response.status_code == 201
assert response.json()["title"] == "Test Todo"
assert "id" in response.json()
assert mock_session.commit.called
```

## Templates Reference

Access templates from `assets/templates/`:

| Template | Use Case |
|----------|----------|
| `component.test.tsx` | React component with props, events, rendering |
| `hook.test.ts` | Custom React hook with state/effects |
| `api.test.tsx` | Frontend API integration with MSW |
| `test_model.py` | SQLModel database model validation |
| `test_crud.py` | Database CRUD operations |
| `test_api.py` | FastAPI endpoint testing |

## Patterns Reference

Learn testing patterns from `references/`:

| Reference | Content |
|-----------|---------|
| `jest-patterns.md` | Jest configuration, mocking, async testing |
| `pytest-patterns.md` | pytest fixtures, parametrization, markers |
| `react-testing-library.md` | RTL best practices, queries, user events |
| `aaa-pattern.md` | Arrange-Act-Assert structure and examples |
| `mocking-strategies.md` | API mocking, database mocking, time mocking |

## Checklist Before Returning Tests

- [ ] All requirements from specification covered
- [ ] AAA pattern applied consistently
- [ ] Test names are descriptive and specific
- [ ] External dependencies are mocked
- [ ] Happy path and error cases included
- [ ] Edge cases and boundary values tested
- [ ] Assertions are specific and meaningful
- [ ] Tests are isolated and independent
- [ ] Mock data is realistic and complete
- [ ] File header includes spec/task reference
- [ ] Follows project naming conventions
- [ ] Achieves 70%+ coverage target

## Common Test Patterns

### React Component Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from './TodoList';

describe('TodoList', () => {
  it('should render list of todos', () => {
    // Arrange
    const todos = [{ id: '1', title: 'Test', completed: false }];

    // Act
    render(<TodoList todos={todos} />);

    // Assert
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should call onToggle when checkbox is clicked', async () => {
    // Arrange
    const mockOnToggle = jest.fn();
    const todos = [{ id: '1', title: 'Test', completed: false }];
    render(<TodoList todos={todos} onToggle={mockOnToggle} />);

    // Act
    await userEvent.click(screen.getByRole('checkbox'));

    // Assert
    expect(mockOnToggle).toHaveBeenCalledWith('1');
  });
});
```

### FastAPI Endpoint Testing

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestTodoEndpoints:
    def test_create_todo_success(self, mock_session):
        # Arrange
        todo_data = {"title": "Test Todo", "completed": False}

        # Act
        response = client.post("/api/todos", json=todo_data)

        # Assert
        assert response.status_code == 201
        assert response.json()["title"] == todo_data["title"]

    def test_create_todo_missing_title_returns_422(self):
        # Arrange
        invalid_data = {"completed": False}

        # Act
        response = client.post("/api/todos", json=invalid_data)

        # Assert
        assert response.status_code == 422
        assert "title" in response.json()["detail"][0]["loc"]
```

## Coverage Requirements

Per constitution, minimum 70% coverage required:

```bash
# Jest coverage
npm test -- --coverage --coverageThreshold='{"global":{"lines":70}}'

# pytest coverage
pytest --cov=app --cov-report=term --cov-fail-under=70
```

## Integration with TDD Workflow

This skill integrates with the TDD Red-Green-Refactor cycle:

1. **Red**: Use this skill to generate failing tests
2. **Green**: Implement minimal code to pass tests
3. **Refactor**: Improve code while maintaining test pass

Use with `/tdd-red-green-refactor` skill for complete TDD workflow.
