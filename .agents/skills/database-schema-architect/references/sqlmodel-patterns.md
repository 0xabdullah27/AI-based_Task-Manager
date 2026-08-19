# SQLModel Patterns

## Basic Table Definition

```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
import uuid

class Todo(SQLModel, table=True):
    """Todo database model"""
    __tablename__ = "todo"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
    )
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    completed: bool = Field(default=False)
    user_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
```

## Field Patterns

### Required String with Max Length

```python
title: str = Field(max_length=200)
```

### Optional String

```python
description: Optional[str] = Field(default=None, max_length=2000)
```

### Boolean with Default

```python
completed: bool = Field(default=False)
```

### UUID Primary Key

```python
id: str = Field(
    default_factory=lambda: str(uuid.uuid4()),
    primary_key=True,
)
```

### Foreign Key with Index

```python
user_id: str = Field(foreign_key="user.id", index=True)
```

### Timestamp with Auto-Default

```python
created_at: datetime = Field(default_factory=datetime.utcnow)
updated_at: Optional[datetime] = Field(default=None)
```

### Email with Unique Constraint

```python
email: str = Field(unique=True, index=True)
```

## Relationship Patterns

### Many-to-One (Todo belongs to User)

```python
from sqlmodel import Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User

class Todo(SQLModel, table=True):
    user_id: str = Field(foreign_key="user.id", index=True)
    user: Optional["User"] = Relationship(back_populates="todos")
```

### One-to-Many (User has many Todos)

```python
class User(SQLModel, table=True):
    todos: list["Todo"] = Relationship(back_populates="user")
```

## Schema Separation Pattern

### Database Model (table=True)

```python
class Todo(SQLModel, table=True):
    """Database table model"""
    __tablename__ = "todo"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    completed: bool = Field(default=False)
    user_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
```

### Create Schema (API Input)

```python
class TodoCreate(SQLModel):
    """Schema for creating a todo"""
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
```

### Update Schema (Partial Update)

```python
class TodoUpdate(SQLModel):
    """Schema for updating a todo - all fields optional"""
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    completed: Optional[bool] = Field(default=None)
```

### Read Schema (API Output)

```python
class TodoRead(SQLModel):
    """Schema for reading a todo"""
    id: str
    title: str
    description: Optional[str]
    completed: bool
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime]
```

## Database Connection

### Synchronous Engine

```python
from sqlmodel import create_engine, Session

DATABASE_URL = "postgresql://user:pass@host/db"

engine = create_engine(
    DATABASE_URL,
    echo=True,  # SQL logging
    pool_pre_ping=True,  # Connection health check
)

def get_session():
    with Session(engine) as session:
        yield session
```

### Create Tables

```python
from sqlmodel import SQLModel

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
```

## CRUD Operations

### Create

```python
def create_todo(session: Session, user_id: str, data: TodoCreate) -> Todo:
    todo = Todo(**data.model_dump(), user_id=user_id)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo
```

### Read All

```python
from sqlmodel import select

def get_todos(session: Session, user_id: str) -> list[Todo]:
    statement = select(Todo).where(Todo.user_id == user_id)
    return session.exec(statement).all()
```

### Read One

```python
def get_todo(session: Session, user_id: str, todo_id: str) -> Todo | None:
    statement = select(Todo).where(
        Todo.id == todo_id,
        Todo.user_id == user_id,
    )
    return session.exec(statement).first()
```

### Update

```python
def update_todo(
    session: Session,
    user_id: str,
    todo_id: str,
    data: TodoUpdate,
) -> Todo | None:
    todo = get_todo(session, user_id, todo_id)
    if not todo:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo, key, value)

    todo.updated_at = datetime.utcnow()
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo
```

### Delete

```python
def delete_todo(session: Session, user_id: str, todo_id: str) -> bool:
    todo = get_todo(session, user_id, todo_id)
    if not todo:
        return False

    session.delete(todo)
    session.commit()
    return True
```

## Neon PostgreSQL Configuration

```python
import os
from sqlmodel import create_engine

# Neon connection string with SSL
DATABASE_URL = os.getenv("DATABASE_URL")
# Format: postgresql://user:password@host.neon.tech/database?sslmode=require

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,  # Recycle connections every 5 minutes
)
```

## Common Gotchas

1. **Don't use `default=uuid.uuid4()`** - Use `default_factory`
2. **Index foreign keys** - Always add `index=True` to foreign key fields
3. **Use Optional for nullable** - `Optional[str] = Field(default=None)`
4. **Separate schemas** - Don't use table model for API input/output
5. **Refresh after commit** - Call `session.refresh(obj)` after commit
