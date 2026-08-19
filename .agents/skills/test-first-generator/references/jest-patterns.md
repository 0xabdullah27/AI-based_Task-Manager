# Jest Testing Patterns

Comprehensive patterns for testing JavaScript/TypeScript with Jest.

## Jest Configuration

### Basic jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 70,
      functions: 70,
      statements: 70,
    },
  },
};
```

### jest.setup.js

```javascript
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

// MSW setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';
```

## Mocking Patterns

### Module Mocking

```typescript
// Mock entire module
jest.mock('@/lib/api', () => ({
  fetchTodos: jest.fn(),
  createTodo: jest.fn(),
}));

// Mock specific functions
import { fetchTodos } from '@/lib/api';
(fetchTodos as jest.Mock).mockResolvedValue([
  { id: '1', title: 'Test', completed: false },
]);
```

### Function Mocking

```typescript
// Mock function implementation
const mockCallback = jest.fn((x) => x * 2);
mockCallback(2); // Returns 4

// Verify calls
expect(mockCallback).toHaveBeenCalledTimes(1);
expect(mockCallback).toHaveBeenCalledWith(2);

// Mock return values
mockCallback.mockReturnValue(10);
mockCallback.mockResolvedValue(Promise.resolve(10));
mockCallback.mockRejectedValue(new Error('Failed'));
```

### Class Mocking

```typescript
// Mock class
jest.mock('@/lib/TodoService');
import TodoService from '@/lib/TodoService';

const mockTodoService = TodoService as jest.MockedClass<typeof TodoService>;
mockTodoService.prototype.getTodos.mockResolvedValue([]);
```

### Timer Mocking

```typescript
// Mock timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

it('should debounce search input', () => {
  const mockSearch = jest.fn();
  render(<SearchInput onSearch={mockSearch} />);

  userEvent.type(screen.getByRole('textbox'), 'test');

  // Fast-forward time
  jest.advanceTimersByTime(500);

  expect(mockSearch).toHaveBeenCalledWith('test');
});
```

### Date Mocking

```typescript
// Mock Date
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

// Cleanup
afterAll(() => {
  jest.restoreAllMocks();
});
```

## Async Testing Patterns

### Testing Promises

```typescript
it('should fetch todos successfully', async () => {
  // Using async/await
  const todos = await fetchTodos();
  expect(todos).toHaveLength(2);
});

it('should handle fetch error', async () => {
  (fetchTodos as jest.Mock).mockRejectedValue(new Error('Failed'));

  await expect(fetchTodos()).rejects.toThrow('Failed');
});
```

### Testing with waitFor

```typescript
import { waitFor } from '@testing-library/react';

it('should display todos after loading', async () => {
  render(<TodoList />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
  });
});
```

### Testing Async State Changes

```typescript
it('should update UI after async operation', async () => {
  const { rerender } = render(<TodoList />);

  // Trigger async operation
  userEvent.click(screen.getByRole('button', { name: /refresh/i }));

  // Wait for state change
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  expect(screen.getByText('Updated Todo')).toBeInTheDocument();
});
```

## Spy Patterns

### Spying on Methods

```typescript
// Spy on object method
const todoService = new TodoService();
const spy = jest.spyOn(todoService, 'getTodos');

await todoService.getTodos();

expect(spy).toHaveBeenCalled();
expect(spy).toHaveReturnedWith(expect.any(Array));

// Restore original implementation
spy.mockRestore();
```

### Spying on Console

```typescript
it('should log error message', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

  performErrorOperation();

  expect(consoleErrorSpy).toHaveBeenCalledWith('Error occurred');

  consoleErrorSpy.mockRestore();
});
```

## Snapshot Testing

### Component Snapshots

```typescript
it('should match snapshot', () => {
  const { container } = render(<TodoItem todo={mockTodo} />);
  expect(container).toMatchSnapshot();
});

// Update snapshots with: jest --updateSnapshot
```

### Inline Snapshots

```typescript
it('should return formatted todo', () => {
  const result = formatTodo(mockTodo);

  expect(result).toMatchInlineSnapshot(`
    {
      "completed": false,
      "id": "1",
      "title": "Test Todo",
    }
  `);
});
```

## Parameterized Tests

### test.each

```typescript
describe.each([
  { input: '', expected: false },
  { input: 'a', expected: true },
  { input: 'test', expected: true },
])('validateTitle($input)', ({ input, expected }) => {
  it(`should return ${expected}`, () => {
    expect(validateTitle(input)).toBe(expected);
  });
});
```

### Table Syntax

```typescript
test.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added to $b', ({ a, b, expected }) => {
  expect(add(a, b)).toBe(expected);
});
```

## Custom Matchers

### Creating Custom Matchers

```typescript
expect.extend({
  toBeValidTodo(received) {
    const pass =
      typeof received.id === 'string' &&
      typeof received.title === 'string' &&
      typeof received.completed === 'boolean';

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid todo`
          : `Expected ${received} to be a valid todo`,
    };
  },
});

// Usage
expect(todo).toBeValidTodo();
```

## Setup and Teardown

### Test Lifecycle Hooks

```typescript
// Runs once before all tests
beforeAll(() => {
  // Setup test database
});

// Runs before each test
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
});

// Runs after each test
afterEach(() => {
  // Cleanup
  cleanup();
});

// Runs once after all tests
afterAll(() => {
  // Close connections
});
```

### Scoped Hooks

```typescript
describe('TodoList', () => {
  beforeEach(() => {
    // Runs before each test in this describe block
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      // Runs before each test in this nested describe
      setupAuth();
    });

    it('should display todos', () => {});
  });
});
```

## Error Testing

### Testing Thrown Errors

```typescript
it('should throw error for invalid input', () => {
  expect(() => {
    createTodo({ title: '' });
  }).toThrow('Title is required');
});

it('should throw specific error type', () => {
  expect(() => {
    createTodo({ title: '' });
  }).toThrow(ValidationError);
});
```

### Testing Async Errors

```typescript
it('should reject with error', async () => {
  await expect(fetchTodos()).rejects.toThrow('Network error');
});

it('should handle error gracefully', async () => {
  (fetchTodos as jest.Mock).mockRejectedValue(new Error('Failed'));

  render(<TodoList />);

  await waitFor(() => {
    expect(screen.getByText('Error loading todos')).toBeInTheDocument();
  });
});
```

## Coverage Patterns

### Ignore Coverage

```typescript
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  console.log('Debug mode');
}
```

### Branch Coverage

```typescript
// Ensure all branches are tested
function getTodoStatus(todo: Todo): string {
  if (todo.completed) return 'done'; // Test this branch
  if (todo.dueDate < new Date()) return 'overdue'; // Test this branch
  return 'pending'; // Test this branch
}
```

## Best Practices

### Test Organization

```typescript
describe('TodoService', () => {
  describe('getTodos', () => {
    it('should return all todos', () => {});
    it('should filter by completed status', () => {});
    it('should handle empty results', () => {});
  });

  describe('createTodo', () => {
    it('should create todo with valid data', () => {});
    it('should throw error for invalid data', () => {});
  });
});
```

### Test Naming

```typescript
// Good: Descriptive and specific
it('should display validation error when title is empty', () => {});

// Bad: Vague and unclear
it('validation test', () => {});
```

### AAA Pattern

```typescript
it('should mark todo as completed', async () => {
  // Arrange
  const todo = { id: '1', title: 'Test', completed: false };
  const mockUpdate = jest.fn();

  // Act
  await updateTodo(todo.id, { completed: true });

  // Assert
  expect(mockUpdate).toHaveBeenCalledWith(
    todo.id,
    expect.objectContaining({ completed: true })
  );
});
```

### Avoid Test Interdependence

```typescript
// Bad: Tests depend on each other
let todos: Todo[] = [];

it('should add todo', () => {
  todos.push(mockTodo); // Modifies shared state
});

it('should have one todo', () => {
  expect(todos).toHaveLength(1); // Depends on previous test
});

// Good: Independent tests
it('should add todo', () => {
  const todos: Todo[] = [];
  todos.push(mockTodo);
  expect(todos).toHaveLength(1);
});

it('should have empty list initially', () => {
  const todos: Todo[] = [];
  expect(todos).toHaveLength(0);
});
```
