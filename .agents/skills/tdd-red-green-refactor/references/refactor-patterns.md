# Refactor Phase Patterns

Improving code while keeping tests green.

## Core Principle

**Improve code structure, readability, and maintainability WITHOUT changing behavior.**

---

## Refactoring Mindset

**Focus**: Clean up implementation while tests stay green.

**Rules**:
1. Tests MUST pass before refactoring
2. Tests MUST pass after each refactoring step
3. One refactoring at a time
4. Commit if you break something and need to revert

**Remember**: If tests break, you changed behavior (not allowed). Revert and try smaller steps.

---

## Safe Refactoring Workflow

```
Before Refactor:
  ✅ All tests pass
  ↓
Identify improvement
  ↓
Make ONE small change
  ↓
Run tests
  ↓
✅ Tests pass? → Continue
❌ Tests fail? → Revert, try smaller change
  ↓
Commit refactor phase
```

---

## Common Refactoring Patterns

### 1. Extract Function

**Before (Green)**:
```typescript
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo.id)}
          />
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.title}
          </span>
          <button onClick={() => handleDelete(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

**After (Refactor)**:
```typescript
// Extract todo item to separate component
function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.title}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  );
}
```

### 2. Extract Variable

**Before (Green)**:
```python
def calculate_price(quantity, unit_price, discount_percent):
    return quantity * unit_price * (1 - discount_percent / 100)
```

**After (Refactor)**:
```python
def calculate_price(quantity, unit_price, discount_percent):
    subtotal = quantity * unit_price
    discount_multiplier = 1 - discount_percent / 100
    return subtotal * discount_multiplier
```

### 3. Rename for Clarity

**Before (Green)**:
```typescript
function TodoForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [t, setT] = useState('');
  const [d, setD] = useState('');
  const [e, setE] = useState('');

  const h = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!t.trim()) {
      setE('Title is required');
      return;
    }
    onSubmit({ t, d });
  };

  return (/* form */);
}
```

**After (Refactor)**:
```typescript
function TodoForm({ onSubmit }: { onSubmit: (data: TodoFormData) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    onSubmit({ title, description });
  };

  return (/* form */);
}
```

### 4. Remove Duplication

**Before (Green)**:
```python
@app.get("/api/todos/{todo_id}")
def get_todo(todo_id: int, user_id: int = Depends(get_current_user_id)):
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return todo

@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: int, user_id: int = Depends(get_current_user_id)):
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(todo)
    db.commit()
```

**After (Refactor)**:
```python
def get_user_todo(db: Session, todo_id: int, user_id: int) -> Todo:
    """Get todo and verify user owns it."""
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return todo

@app.get("/api/todos/{todo_id}")
def get_todo(todo_id: int, user_id: int = Depends(get_current_user_id)):
    return get_user_todo(db, todo_id, user_id)

@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: int, user_id: int = Depends(get_current_user_id)):
    todo = get_user_todo(db, todo_id, user_id)
    db.delete(todo)
    db.commit()
```

### 5. Simplify Conditional Logic

**Before (Green)**:
```typescript
function getStatusColor(todo: Todo): string {
  if (todo.completed === true) {
    return 'green';
  } else {
    if (todo.priority === 'high') {
      return 'red';
    } else if (todo.priority === 'medium') {
      return 'orange';
    } else {
      return 'gray';
    }
  }
}
```

**After (Refactor)**:
```typescript
function getStatusColor(todo: Todo): string {
  if (todo.completed) return 'green';

  const priorityColors: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'gray',
  };

  return priorityColors[todo.priority] || 'gray';
}
```

### 6. Replace Magic Numbers

**Before (Green)**:
```python
def is_valid_title(title: str) -> bool:
    return len(title) >= 3 and len(title) <= 100

def is_valid_description(description: str) -> bool:
    return len(description) <= 500
```

**After (Refactor)**:
```python
TITLE_MIN_LENGTH = 3
TITLE_MAX_LENGTH = 100
DESCRIPTION_MAX_LENGTH = 500

def is_valid_title(title: str) -> bool:
    return TITLE_MIN_LENGTH <= len(title) <= TITLE_MAX_LENGTH

def is_valid_description(description: str) -> bool:
    return len(description) <= DESCRIPTION_MAX_LENGTH
```

### 7. Improve Type Definitions

**Before (Green)**:
```typescript
function filterTodos(todos: any[], filter: string): any[] {
  if (filter === 'completed') {
    return todos.filter(t => t.completed === true);
  } else if (filter === 'active') {
    return todos.filter(t => t.completed === false);
  } else {
    return todos;
  }
}
```

**After (Refactor)**:
```typescript
type TodoFilter = 'all' | 'completed' | 'active';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

function filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  switch (filter) {
    case 'completed':
      return todos.filter(todo => todo.completed);
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'all':
    default:
      return todos;
  }
}
```

---

## Refactoring Techniques

### Technique 1: Extract Component (React)

**When**: Component too large or doing multiple things.

**Steps**:
1. Identify cohesive section
2. Extract to new component
3. Pass props
4. Run tests
5. Verify behavior unchanged

### Technique 2: Extract Service (Backend)

**When**: Endpoint has business logic.

**Steps**:
1. Create service function
2. Move logic to service
3. Call service from endpoint
4. Run tests
5. Verify responses unchanged

### Technique 3: Replace Inline Code with Function Call

**When**: Same code appears in multiple places.

**Steps**:
1. Find duplicated code
2. Extract to function
3. Replace all occurrences
4. Run tests after each replacement

### Technique 4: Introduce Parameter Object

**When**: Function has too many parameters.

**Before**:
```typescript
function createTodo(
  title: string,
  description: string,
  priority: string,
  dueDate: Date,
  tags: string[]
) {
  // ...
}
```

**After**:
```typescript
interface CreateTodoParams {
  title: string;
  description: string;
  priority: string;
  dueDate: Date;
  tags: string[];
}

function createTodo(params: CreateTodoParams) {
  // ...
}
```

### Technique 5: Replace Conditional with Polymorphism

**Before**:
```python
def process_todo(todo: Todo, action: str):
    if action == "complete":
        todo.completed = True
        todo.completed_at = datetime.now()
    elif action == "uncomplete":
        todo.completed = False
        todo.completed_at = None
    elif action == "archive":
        todo.archived = True
        todo.archived_at = datetime.now()
```

**After**:
```python
class TodoAction:
    def execute(self, todo: Todo):
        raise NotImplementedError

class CompleteTodoAction(TodoAction):
    def execute(self, todo: Todo):
        todo.completed = True
        todo.completed_at = datetime.now()

class UncompleteTodoAction(TodoAction):
    def execute(self, todo: Todo):
        todo.completed = False
        todo.completed_at = None

class ArchiveTodoAction(TodoAction):
    def execute(self, todo: Todo):
        todo.archived = True
        todo.archived_at = datetime.now()

def process_todo(todo: Todo, action: TodoAction):
    action.execute(todo)
```

---

## Frontend-Specific Refactorings

### 1. Extract Custom Hook

**Before**:
```typescript
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => {
        setTodos(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ... render
}
```

**After**:
```typescript
function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => {
        setTodos(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { todos, loading, error };
}

function TodoList() {
  const { todos, loading, error } = useTodos();
  // ... render
}
```

### 2. Component Composition

**Before**:
```typescript
function TodoApp() {
  return (
    <div className="container">
      <header className="header">
        <h1>My Todos</h1>
        <button onClick={logout}>Logout</button>
      </header>
      <div className="filters">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id}>{/* todo item */}</li>
        ))}
      </ul>
    </div>
  );
}
```

**After**:
```typescript
function TodoApp() {
  return (
    <div className="container">
      <TodoHeader onLogout={logout} />
      <TodoFilters filter={filter} onFilterChange={setFilter} />
      <TodoForm onSubmit={handleSubmit} />
      <TodoList todos={filteredTodos} />
    </div>
  );
}
```

---

## Backend-Specific Refactorings

### 1. Extract Repository Pattern

**Before**:
```python
@app.get("/api/todos")
def get_todos(user_id: int = Depends(get_current_user_id)):
    todos = db.query(Todo).filter(Todo.user_id == user_id).all()
    return todos

@app.post("/api/todos")
def create_todo(todo: TodoCreate, user_id: int = Depends(get_current_user_id)):
    new_todo = Todo(**todo.dict(), user_id=user_id)
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo
```

**After**:
```python
# repositories/todo_repository.py
class TodoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_todos(self, user_id: int) -> List[Todo]:
        return self.db.query(Todo).filter(Todo.user_id == user_id).all()

    def create_todo(self, todo_data: TodoCreate, user_id: int) -> Todo:
        new_todo = Todo(**todo_data.dict(), user_id=user_id)
        self.db.add(new_todo)
        self.db.commit()
        self.db.refresh(new_todo)
        return new_todo

# main.py
@app.get("/api/todos")
def get_todos(
    user_id: int = Depends(get_current_user_id),
    repo: TodoRepository = Depends(get_todo_repository)
):
    return repo.get_user_todos(user_id)

@app.post("/api/todos")
def create_todo(
    todo: TodoCreate,
    user_id: int = Depends(get_current_user_id),
    repo: TodoRepository = Depends(get_todo_repository)
):
    return repo.create_todo(todo, user_id)
```

### 2. Extract Validation

**Before**:
```python
@app.post("/api/todos")
def create_todo(todo: TodoCreate):
    if not todo.title or not todo.title.strip():
        raise HTTPException(400, "Title is required")
    if len(todo.title) > 100:
        raise HTTPException(400, "Title too long")
    if todo.description and len(todo.description) > 500:
        raise HTTPException(400, "Description too long")
    # ... create todo
```

**After**:
```python
# validators/todo_validator.py
from pydantic import BaseModel, validator

class TodoCreate(BaseModel):
    title: str
    description: str | None = None

    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title is required')
        if len(v) > 100:
            raise ValueError('Title must be 100 characters or less')
        return v.strip()

    @validator('description')
    def validate_description(cls, v):
        if v and len(v) > 500:
            raise ValueError('Description must be 500 characters or less')
        return v

# main.py
@app.post("/api/todos")
def create_todo(todo: TodoCreate):
    # Validation automatic via Pydantic
    # ... create todo
```

---

## Refactoring Checklist

For each refactoring:

- [ ] Tests pass before starting
- [ ] Made ONE change at a time
- [ ] Ran tests after change
- [ ] Tests still pass
- [ ] Behavior unchanged (same inputs → same outputs)
- [ ] Code is more readable
- [ ] Duplication reduced
- [ ] Better naming

Before committing refactor:

- [ ] All tests pass
- [ ] Coverage maintained or improved
- [ ] No new functionality added
- [ ] Code easier to understand
- [ ] Ready for next feature

---

## When NOT to Refactor

### Don't refactor if:

1. **Tests are failing** - Fix tests first
2. **About to add feature** - Wait until after TDD cycle
3. **Not sure it improves code** - Skip it
4. **Changes behavior** - That's not refactoring
5. **No tests exist** - Add tests first

### Refactoring is NOT:

- Adding features
- Fixing bugs
- Changing functionality
- Performance optimization (unless profiled)
- Rewriting everything

---

## Refactoring Anti-Patterns

### 1. Big Bang Refactor

**Bad**:
```
- Refactor entire codebase at once
- Change 50 files
- Tests break everywhere
- Can't identify what broke
```

**Good**:
```
- Refactor one component at a time
- Change 1-2 files
- Tests stay green
- Easy to revert if needed
```

### 2. Premature Abstraction

**Bad**:
```typescript
// Creating framework before understanding needs
class AbstractTodoFactory {
  abstract createTodo(): AbstractTodo;
}

class ConcreteTodoFactory extends AbstractTodoFactory {
  // ... excessive abstraction for simple todo
}
```

**Good**:
```typescript
// Simple, direct code
function createTodo(title: string): Todo {
  return { id: nextId++, title, completed: false };
}
```

### 3. Refactoring Without Tests

**Bad**:
```
1. No tests exist
2. Refactor code anyway
3. Hope nothing broke
4. Ship to production
```

**Good**:
```
1. Write tests first
2. Verify tests pass
3. Refactor
4. Tests confirm behavior unchanged
```

---

## Summary

**Refactor Phase Goal**: Improve code quality while keeping tests green.

**Key Principles**:
1. Tests must pass before and after
2. One change at a time
3. No behavior changes
4. Commit frequently
5. Revert if tests break

**Common Refactorings**:
- Extract function/component
- Rename for clarity
- Remove duplication
- Simplify logic
- Improve types

**Next**: Ready for next TDD cycle (RED → GREEN → REFACTOR).
