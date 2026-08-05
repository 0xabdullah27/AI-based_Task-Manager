"""Data access layer for Task model — pure SQL queries, no business logic."""
from sqlmodel import Session, select, case
from sqlalchemy.orm import selectinload
from typing import List, Optional

from src.models.task import Task
from src.models.tag import Tag, TaskTag
from src.models.priority import Priority


class TaskRepository:
    """Repository for Task data access operations."""

    def insert_task(self, session: Session, task: Task) -> Task:
        """Insert a task into the database."""
        session.add(task)
        session.flush()
        return task

    def find_by_id(self, session: Session, task_id: str, user_id: str) -> Optional[Task]:
        """Find a task by ID scoped to user. Returns None if not found."""
        statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        return session.exec(statement).first()

    def find_by_id_with_tags(self, session: Session, task_id: str, user_id: str) -> Optional[Task]:
        """Find a task by ID with eager-loaded tags."""
        statement = (
            select(Task)
            .where(Task.id == task_id, Task.user_id == user_id)
            .options(selectinload(Task.tags))
        )
        return session.exec(statement).first()

    def find_all(
        self,
        session: Session,
        user_id: str,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        tags: Optional[list] = None,
        no_tags: bool = False,
        sort_field: str = "priority",
        sort_order: str = "asc",
        offset: int = 0,
        limit: int = 100,
    ) -> List[Task]:
        """Query tasks with filtering, searching, sorting, and pagination."""
        statement = (
            select(Task)
            .where(Task.user_id == user_id)
            .options(selectinload(Task.tags))
        )

        if search:
            search_term = f"%{search}%"
            statement = statement.where(
                Task.title.ilike(search_term) | Task.description.ilike(search_term)
            )

        if status and status != "all":
            if status == "pending":
                statement = statement.where(Task.completed == False)
            elif status == "completed":
                statement = statement.where(Task.completed == True)

        if priority and priority != "all":
            statement = statement.where(Task.priority == priority)

        if tags:
            statement = (
                statement.join(TaskTag).join(Tag).where(Tag.name.in_(tags))
            )

        if no_tags:
            statement = statement.outerjoin(TaskTag).where(TaskTag.task_id.is_(None))

        # Sorting
        if sort_field == "priority":
            priority_order = case(
                (Task.priority == Priority.HIGH, 0),
                (Task.priority == Priority.MEDIUM, 1),
                (Task.priority == Priority.LOW, 2),
                (Task.priority == Priority.NONE, 3),
                else_=4,
            )
            if sort_order == "desc":
                statement = statement.order_by(priority_order.desc(), Task.created_at.desc())
            else:
                statement = statement.order_by(priority_order, Task.created_at.desc())
        elif sort_field == "title":
            col = Task.title.desc() if sort_order == "desc" else Task.title.asc()
            statement = statement.order_by(col)
        elif sort_field == "created_at":
            col = Task.created_at.desc() if sort_order == "desc" else Task.created_at.asc()
            statement = statement.order_by(col)

        statement = statement.offset(offset).limit(limit)
        return list(session.exec(statement).all())

    def delete(self, session: Session, task: Task) -> None:
        """Delete a task from the database."""
        session.delete(task)

    def delete_task_tags(self, session: Session, task_id: str) -> None:
        """Remove all tag relationships for a task."""
        statement = select(TaskTag).where(TaskTag.task_id == task_id)
        for task_tag in session.exec(statement).all():
            session.delete(task_tag)

    def link_task_tag(self, session: Session, task_id: str, tag_id: str) -> None:
        """Create a task-tag relationship."""
        session.add(TaskTag(task_id=task_id, tag_id=tag_id))


task_repo = TaskRepository()
