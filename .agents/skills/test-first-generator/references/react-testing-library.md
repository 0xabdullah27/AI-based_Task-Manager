# React Testing Library Best Practices

Testing React components with React Testing Library (RTL) focusing on user behavior.

## Core Principles

### Test Like a User

React Testing Library encourages testing from the user's perspective:

```typescript
// Good: Query by role and accessible name
screen.getByRole('button', { name: /submit/i });

// Avoid: Query by implementation details
container.querySelector('.submit-button');
```

### Prefer Accessible Queries

Priority order for queries:

1. **getByRole** - Accessible to assistive technology
2. **getByLabelText** - Form inputs with labels
3. **getByPlaceholderText** - Form inputs with placeholders
4. **getByText** - Non-interactive elements
5. **getByDisplayValue** - Form inputs with values
6. **getByAltText** - Images with alt text
7. **getByTitle** - Elements with title attribute
8. **getByTestId** - Last resort for elements without better queries

## Query Patterns

### getByRole

```typescript
import { render, screen } from '@testing-library/react';

// Buttons
screen.getByRole('button', { name: /submit/i });
screen.getByRole('button', { name: 'Add Todo' });

// Links
screen.getByRole('link', { name: /learn more/i });

// Headings
screen.getByRole('heading', { name: /todos/i, level: 1 });

// Form elements
screen.getByRole('textbox', { name: /title/i });
screen.getByRole('checkbox', { name: /completed/i });
screen.getByRole('combobox', { name: /priority/i });

// Lists
screen.getByRole('list');
screen.getAllByRole('listitem');
```

### getByLabelText

```typescript
// Input with label
screen.getByLabelText(/title/i);
screen.getByLabelText('Todo Title');

// Works with aria-label too
screen.getByLabelText('Search');
```

### getByText

```typescript
// Exact match
screen.getByText('No todos found');

// Regex match (case insensitive)
screen.getByText(/no todos/i);

// Function matcher
screen.getByText((content, element) => {
  return element?.tagName.toLowerCase() === 'span' && content.startsWith('Todo:');
});
```

### getAllBy Queries

```typescript
// Get multiple elements
const todoItems = screen.getAllByRole('listitem');
expect(todoItems).toHaveLength(3);

// Get all buttons
const buttons = screen.getAllByRole('button');
```

### queryBy Queries

```typescript
// Use queryBy when element might not exist
const error = screen.queryByText(/error/i);
expect(error).not.toBeInTheDocument();

// getBy would throw if element doesn't exist
expect(() => screen.getByText(/error/i)).toThrow();
```

### findBy Queries (Async)

```typescript
// Use findBy for async elements
const todo = await screen.findByText('New Todo');
expect(todo).toBeInTheDocument();

// With timeout
const todo = await screen.findByText('New Todo', {}, { timeout: 3000 });
```

## Rendering Components

### Basic Rendering

```typescript
import { render, screen } from '@testing-library/react';
import TodoList from './TodoList';

test('renders todo list', () => {
  render(<TodoList todos={[]} />);
  expect(screen.getByText(/no todos/i)).toBeInTheDocument();
});
```

### Rendering with Props

```typescript
test('renders todos', () => {
  const todos = [
    { id: '1', title: 'First Todo', completed: false },
    { id: '2', title: 'Second Todo', completed: true },
  ];

  render(<TodoList todos={todos} />);

  expect(screen.getByText('First Todo')).toBeInTheDocument();
  expect(screen.getByText('Second Todo')).toBeInTheDocument();
});
```

### Rendering with Providers

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

test('renders with query client', () => {
  renderWithProviders(<TodoList />);
});
```

### Custom Render Helper

```typescript
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## User Interactions

### userEvent Setup

```typescript
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

test('user can type in input', async () => {
  const user = userEvent.setup();
  render(<TodoForm />);

  const input = screen.getByRole('textbox', { name: /title/i });
  await user.type(input, 'New Todo');

  expect(input).toHaveValue('New Todo');
});
```

### Click Events

```typescript
test('user can click button', async () => {
  const user = userEvent.setup();
  const mockOnClick = jest.fn();
  render(<button onClick={mockOnClick}>Click Me</button>);

  await user.click(screen.getByRole('button'));

  expect(mockOnClick).toHaveBeenCalledTimes(1);
});
```

### Keyboard Interactions

```typescript
test('user can use keyboard', async () => {
  const user = userEvent.setup();
  render(<TodoForm />);

  const input = screen.getByRole('textbox');

  // Type
  await user.type(input, 'Test');

  // Press Enter
  await user.keyboard('{Enter}');

  // Tab to next element
  await user.tab();
});
```

### Form Interactions

```typescript
test('user can submit form', async () => {
  const user = userEvent.setup();
  const mockOnSubmit = jest.fn();
  render(<TodoForm onSubmit={mockOnSubmit} />);

  // Fill form
  await user.type(screen.getByRole('textbox', { name: /title/i }), 'New Todo');
  await user.click(screen.getByRole('checkbox', { name: /completed/i }));

  // Submit
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(mockOnSubmit).toHaveBeenCalledWith({
    title: 'New Todo',
    completed: true,
  });
});
```

### Select Interactions

```typescript
test('user can select option', async () => {
  const user = userEvent.setup();
  render(<TodoForm />);

  const select = screen.getByRole('combobox', { name: /priority/i });
  await user.selectOptions(select, 'high');

  expect(select).toHaveValue('high');
});
```

## Async Testing

### Waiting for Elements

```typescript
import { waitFor, screen } from '@testing-library/react';

test('shows todo after loading', async () => {
  render(<TodoList />);

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  expect(screen.getByText('First Todo')).toBeInTheDocument();
});
```

### findBy Queries

```typescript
test('shows todo after loading', async () => {
  render(<TodoList />);

  // findBy automatically waits
  const todo = await screen.findByText('First Todo');
  expect(todo).toBeInTheDocument();
});
```

### waitForElementToBeRemoved

```typescript
import { waitForElementToBeRemoved } from '@testing-library/react';

test('removes loading spinner', async () => {
  render(<TodoList />);

  const spinner = screen.getByText(/loading/i);

  await waitForElementToBeRemoved(spinner);

  expect(screen.getByText('First Todo')).toBeInTheDocument();
});
```

## Testing Hooks

### renderHook

```typescript
import { renderHook } from '@testing-library/react';
import { useTodos } from './useTodos';

test('useTodos returns initial state', () => {
  const { result } = renderHook(() => useTodos());

  expect(result.current.todos).toEqual([]);
  expect(result.current.isLoading).toBe(false);
});
```

### Testing Hook Updates

```typescript
import { renderHook, act } from '@testing-library/react';

test('useTodos can add todo', () => {
  const { result } = renderHook(() => useTodos());

  act(() => {
    result.current.addTodo({ title: 'New Todo', completed: false });
  });

  expect(result.current.todos).toHaveLength(1);
  expect(result.current.todos[0].title).toBe('New Todo');
});
```

### Testing Async Hooks

```typescript
test('useTodos fetches todos', async () => {
  const { result } = renderHook(() => useTodos());

  // Wait for loading to complete
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.todos).toHaveLength(2);
});
```

## Assertions

### Common Matchers

```typescript
import '@testing-library/jest-dom';

// Element presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibility
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// Form elements
expect(input).toHaveValue('text');
expect(checkbox).toBeChecked();
expect(checkbox).not.toBeChecked();
expect(button).toBeDisabled();
expect(button).toBeEnabled();

// Text content
expect(element).toHaveTextContent('Hello');
expect(element).toHaveTextContent(/hello/i);

// Attributes
expect(element).toHaveAttribute('href', '/todos');
expect(element).toHaveClass('active');

// Accessibility
expect(element).toHaveAccessibleName('Submit');
expect(element).toHaveAccessibleDescription('Submit the form');
```

### Custom Matchers

```typescript
// Check if element has focus
expect(input).toHaveFocus();

// Check display value
expect(input).toHaveDisplayValue('New Todo');

// Check element style
expect(element).toHaveStyle({ display: 'none' });
```

## Mocking

### Mocking API Calls with MSW

```typescript
// mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/todos', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', title: 'First Todo', completed: false },
        { id: '2', title: 'Second Todo', completed: true },
      ])
    );
  }),

  rest.post('/api/todos', (req, res, ctx) => {
    const todo = req.body as Todo;
    return res(
      ctx.status(201),
      ctx.json({ ...todo, id: '3' })
    );
  }),
];

// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// jest.setup.js
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Overriding Handlers

```typescript
test('handles error response', async () => {
  server.use(
    rest.get('/api/todos', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    })
  );

  render(<TodoList />);

  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

### Mocking Modules

```typescript
jest.mock('@/lib/api', () => ({
  fetchTodos: jest.fn(),
}));

import { fetchTodos } from '@/lib/api';

test('calls fetchTodos', async () => {
  (fetchTodos as jest.Mock).mockResolvedValue([
    { id: '1', title: 'Test', completed: false },
  ]);

  render(<TodoList />);

  await waitFor(() => {
    expect(fetchTodos).toHaveBeenCalled();
  });
});
```

## Accessibility Testing

### Checking ARIA Attributes

```typescript
test('has correct ARIA attributes', () => {
  render(<TodoItem todo={mockTodo} />);

  const checkbox = screen.getByRole('checkbox');
  expect(checkbox).toHaveAttribute('aria-label', 'Mark todo as complete');
});
```

### Testing Keyboard Navigation

```typescript
test('can navigate with keyboard', async () => {
  const user = userEvent.setup();
  render(<TodoList />);

  // Tab to first item
  await user.tab();
  expect(screen.getAllByRole('checkbox')[0]).toHaveFocus();

  // Tab to next item
  await user.tab();
  expect(screen.getAllByRole('checkbox')[1]).toHaveFocus();
});
```

### Screen Reader Content

```typescript
test('provides screen reader content', () => {
  render(<TodoList todos={mockTodos} />);

  // Check for visually hidden content
  expect(screen.getByText(/3 todos total/i)).toBeInTheDocument();
});
```

## Best Practices

### Don't Test Implementation Details

```typescript
// Bad: Testing internal state
expect(component.state.todos).toHaveLength(2);

// Good: Testing visible output
expect(screen.getAllByRole('listitem')).toHaveLength(2);
```

### Use User Events Over Fire Event

```typescript
// Prefer userEvent
await user.click(button);
await user.type(input, 'text');

// Avoid fireEvent (lower level)
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'text' } });
```

### Clean Up After Tests

```typescript
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});
```

### Use Data-TestId Sparingly

```typescript
// Last resort when no better query exists
screen.getByTestId('custom-component');

// Prefer semantic queries
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
```

### Test User Flows

```typescript
test('user can add and complete todo', async () => {
  const user = userEvent.setup();
  render(<TodoApp />);

  // Add todo
  await user.type(screen.getByRole('textbox'), 'New Todo');
  await user.click(screen.getByRole('button', { name: /add/i }));

  // Verify added
  expect(screen.getByText('New Todo')).toBeInTheDocument();

  // Complete todo
  await user.click(screen.getByRole('checkbox', { name: /new todo/i }));

  // Verify completed
  expect(screen.getByRole('checkbox')).toBeChecked();
});
```

### Organize Tests by User Scenarios

```typescript
describe('TodoList', () => {
  describe('when user has no todos', () => {
    it('displays empty state message', () => {});
  });

  describe('when user has todos', () => {
    it('displays all todos', () => {});
    it('allows marking todo as complete', () => {});
    it('allows deleting todo', () => {});
  });

  describe('when loading fails', () => {
    it('displays error message', () => {});
    it('shows retry button', () => {});
  });
});
```
