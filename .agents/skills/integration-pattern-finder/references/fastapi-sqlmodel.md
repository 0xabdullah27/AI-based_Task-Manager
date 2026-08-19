# FastAPI + SQLModel Integration Patterns

## Overview

SQLModel combines SQLAlchemy and Pydantic for type-safe database operations with FastAPI.

## Project Setup

### Install Dependencies

```bash
pip install fastapi sqlmodel asyncpg python-dotenv uvicorn
```

### Database Connection (Neon PostgreSQL)

```python
# db/database.py
import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# For Neon serverless, use connection pooling URL
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set False in production
    pool_pre_ping=True,  # Check connection health
)

def create_db_and_tables():
    """Create all tables defined in SQLModel models"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency for getting database session"""
    with Session(engine) as session:
        yield session
```

## Model Patterns

### Base Model with Common Fields

```python
# models/base.py
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
import uuid

class BaseModel(SQLModel):
    """Base model with common fields"""
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
```

### User Model (Matching Better Auth Schema)

```python
# models/user.py
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class User(SQLModel, table=True):
    """User model - matches Better Auth user schema"""
    __tablename__ = "user"

    id: str = Field(primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    email_verified: bool = Field(default=False)
    image: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserRead(SQLModel):
    """User response schema"""
    id: str
    name: str
    email: str
```

### Todo Model with User Relationship

```python
# models/todo.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
import uuid

class TodoBase(SQLModel):
    """Base schema for todo - shared fields"""
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    completed: bool = Field(default=False)

class Todo(TodoBase, table=True):
    """Todo database model"""
    __tablename__ = "todo"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
    )
    user_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class TodoCreate(SQLModel):
    """Schema for creating a todo"""
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)

class TodoUpdate(SQLModel):
    """Schema for updating a todo"""
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    completed: Optional[bool] = None

class TodoRead(TodoBase):
    """Schema for reading a todo"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime]
```

## CRUD Operations

```python
# crud/todo.py
from sqlmodel import Session, select
from models.todo import Todo, TodoCreate, TodoUpdate
from datetime import datetime
from typing import Optional, List

def create_todo(session: Session, user_id: str, todo: TodoCreate) -> Todo:
    """Create a new todo for user"""
    db_todo = Todo(
        **todo.model_dump(),
        user_id=user_id,
    )
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo

def get_todos(session: Session, user_id: str) -> List[Todo]:
    """Get all todos for user"""
    statement = select(Todo).where(Todo.user_id == user_id)
    return session.exec(statement).all()

def get_todo(session: Session, user_id: str, todo_id: str) -> Optional[Todo]:
    """Get a specific todo for user"""
    statement = select(Todo).where(
        Todo.id == todo_id,
        Todo.user_id == user_id,
    )
    return session.exec(statement).first()

def update_todo(
    session: Session,
    user_id: str,
    todo_id: str,
    todo: TodoUpdate,
) -> Optional[Todo]:
    """Update a todo"""
    db_todo = get_todo(session, user_id, todo_id)
    if not db_todo:
        return None

    todo_data = todo.model_dump(exclude_unset=True)
    for key, value in todo_data.items():
        setattr(db_todo, key, value)

    db_todo.updated_at = datetime.utcnow()
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo

def delete_todo(session: Session, user_id: str, todo_id: str) -> bool:
    """Delete a todo"""
    db_todo = get_todo(session, user_id, todo_id)
    if not db_todo:
        return False

    session.delete(db_todo)
    session.commit()
    return True

def toggle_todo_completion(
    session: Session,
    user_id: str,
    todo_id: str,
) -> Optional[Todo]:
    """Toggle todo completion status"""
    db_todo = get_todo(session, user_id, todo_id)
    if not db_todo:
        return None

    db_todo.completed = not db_todo.completed
    db_todo.updated_at = datetime.utcnow()
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo
```

## API Endpoints

```python
# routers/todos.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List

from db.database import get_session
from auth.dependencies import get_current_user
from models.todo import TodoCreate, TodoUpdate, TodoRead
from crud import todo as todo_crud

router = APIRouter(prefix="/api/todos", tags=["todos"])

@router.get("", response_model=List[TodoRead])
async def list_todos(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get all todos for authenticated user"""
    return todo_crud.get_todos(session, current_user["id"])

@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo: TodoCreate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new todo"""
    return todo_crud.create_todo(session, current_user["id"], todo)

@router.get("/{todo_id}", response_model=TodoRead)
async def get_todo(
    todo_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get a specific todo"""
    todo = todo_crud.get_todo(session, current_user["id"], todo_id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return todo

@router.patch("/{todo_id}", response_model=TodoRead)
async def update_todo(
    todo_id: str,
    todo: TodoUpdate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update a todo"""
    updated_todo = todo_crud.update_todo(
        session, current_user["id"], todo_id, todo
    )
    if not updated_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return updated_todo

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a todo"""
    if not todo_crud.delete_todo(session, current_user["id"], todo_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )

@router.post("/{todo_id}/toggle", response_model=TodoRead)
async def toggle_todo(
    todo_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Toggle todo completion status"""
    todo = todo_crud.toggle_todo_completion(
        session, current_user["id"], todo_id
    )
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return todo
```

## Main Application

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db.database import create_db_and_tables
from routers import todos

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(todos.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

## Neon PostgreSQL Specifics

### Connection String Format

```
postgresql://user:password@host.neon.tech/database?sslmode=require
```

### Environment Variables

```env
# .env
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
```

### Connection Pooling

For serverless, use Neon's pooled connection:

```python
# Use pooled connection for serverless
DATABASE_URL = os.getenv("DATABASE_URL")  # Pooled URL from Neon

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,  # Recycle connections every 5 minutes
)
```

## Gotchas

1. **User Table**: Don't create User table in FastAPI if Better Auth manages it. Read-only access.

2. **Foreign Keys**: Ensure `user_id` references the Better Auth user table.

3. **Session Lifecycle**: Use dependency injection for session management.

4. **Neon Cold Starts**: First request may be slow due to serverless cold start.

5. **SSL Mode**: Always use `sslmode=require` for Neon connections.

## Best Practices

1. Use Pydantic schemas for request/response validation
2. Separate database models from API schemas
3. Use dependency injection for database sessions
4. Always filter by `user_id` for user-specific data
5. Use transactions for multi-step operations
