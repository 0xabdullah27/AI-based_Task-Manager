"""Data access repository layer for Task model queries and database operations.

Contains pure SQLModel/SQLAlchemy database queries without higher-level business logic.
"""
from sqlmodel import Session, select, case, func
from sqlalchemy.orm import selectinload
from typing import List, Optional, Union

from src.models.task import Task
from src.models.tag import Tag, TaskTag
from src.models.priority import Priority
from src.schemas.task import StatusFilter, PriorityFilter, SortField, SortOrder


class TaskRepository:
    """Repository class encapsulating database operations for Task records."""

    def insert_task(self, session: Session, task: Task) -> Task:
        """Insert a newly instantiated Task record into the database session.

        Args:
            session (Session): Active database session transaction.
            task (Task): Task model instance to insert.

        Returns:
            Task: The inserted Task model instance (flushed with populated defaults).
        """
        session.add(task)
        session.flush()
        return task

    def find_by_id(self, session: Session, task_id: str, user_id: str) -> Optional[Task]:
        """Find a single task record by task ID and owner user ID.

        Args:
            session (Session): Active database session.
            task_id (str): Unique UUID string of the task.
            user_id (str): Unique ID of the owning user for security scoping.

        Returns:
            Optional[Task]: Matched Task model instance, or None if not found/unauthorized.
        """
        statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        return session.exec(statement).first()

    def find_by_id_with_tags(self, session: Session, task_id: str, user_id: str) -> Optional[Task]:
        """Find a single task record by ID with eagerly-loaded tags and nested subtasks.

        Args:
            session (Session): Active database session.
            task_id (str): Unique UUID string of the task.
            user_id (str): Unique ID of the owning user for security scoping.

        Returns:
            Optional[Task]: Task instance with loaded tags and subtasks relationships, or None.
        """
        statement = (
            select(Task)
            .where(Task.id == task_id, Task.user_id == user_id)
            .options(
                selectinload(Task.tags),
                selectinload(Task.subtasks).selectinload(Task.tags),
            )
        )
        return session.exec(statement).first()

    def find_subtasks(self, session: Session, parent_id: str, user_id: str) -> List[Task]:
        """Find all direct child tasks of a parent, ordered by step position.

        Args:
            session (Session): Active database session.
            parent_id (str): UUID of the parent task.
            user_id (str): Owner user ID for security scoping.

        Returns:
            List[Task]: Child tasks sorted by position ascending.
        """
        statement = (
            select(Task)
            .where(Task.parent_id == parent_id, Task.user_id == user_id)
            .order_by(Task.position.asc(), Task.created_at.asc())
        )
        return list(session.exec(statement).all())

    def next_position(self, session: Session, parent_id: str) -> int:
        """Compute the next step position for a new subtask under a parent.

        Args:
            session (Session): Active database session.
            parent_id (str): UUID of the parent task.

        Returns:
            int: Next 1-based position (max existing position + 1, or 1 if none).
        """
        statement = (
            select(func.max(Task.position))
            .where(Task.parent_id == parent_id)
        )
        max_pos = session.exec(statement).one()
        return (max_pos or 0) + 1

    def delete_task_tag_links_for_tasks(self, session: Session, task_ids: List[str]) -> None:
        """Remove TaskTag join records for multiple tasks (used before cascading deletes).

        Args:
            session (Session): Active database session.
            task_ids (List[str]): UUIDs of tasks whose tag links should be removed.
        """
        if not task_ids:
            return
        statement = select(TaskTag).where(TaskTag.task_id.in_(task_ids))
        for task_tag in session.exec(statement).all():
            session.delete(task_tag)

    def count_total(self, session: Session, user_id: str) -> int:
        """Count the total number of task records owned by a user.

        Args:
            session (Session): Active database session.
            user_id (str): Owner user ID for row-level security.

        Returns:
            int: Total count of user's task records.
        """
        statement = select(func.count(Task.id)).where(Task.user_id == user_id)
        return session.exec(statement).one()

    def count_filtered(
        self,
        session: Session,
        user_id: str,
        search: Optional[str] = None,
        status: Optional[Union[StatusFilter, str]] = None,
        priority: Optional[Union[PriorityFilter, str]] = None,
        tags: Optional[List[str]] = None,
        no_tags: bool = False,
    ) -> int:
        """Count the total number of tasks matching search and filter criteria.

        Args:
            session (Session): Active database session.
            user_id (str): Owner user ID for row-level security.
            search (Optional[str]): Case-insensitive search keyword for title and description.
            status (Optional[Union[StatusFilter, str]]): Completion status filter ('all', 'pending', 'completed').
            priority (Optional[Union[PriorityFilter, str]]): Priority level filter.
            tags (Optional[List[str]]): List of tag names to filter tasks by.
            no_tags (bool): If True, filters for tasks with no attached tags.

        Returns:
            int: Total count of tasks matching all applied filters.
        """
        query = select(func.count(Task.id)).where(
            Task.user_id == user_id,
            Task.parent_id.is_(None),
        )

        if search:
            search_term = f"%{search}%"
            query = query.where(
                Task.title.ilike(search_term) | Task.description.ilike(search_term)
            )

        if status and status != "all" and status != StatusFilter.ALL:
            if status == "pending" or status == StatusFilter.PENDING:
                query = query.where(Task.completed == False)
            elif status == "completed" or status == StatusFilter.COMPLETED:
                query = query.where(Task.completed == True)

        if priority and priority != "all" and priority != PriorityFilter.ALL:
            query = query.where(Task.priority == priority)

        if tags:
            query = query.join(TaskTag).join(Tag).where(Tag.name.in_(tags))

        if no_tags:
            query = query.outerjoin(TaskTag).where(TaskTag.task_id.is_(None))

        return session.exec(query).one()

    def find_all(
        self,
        session: Session,
        user_id: str,
        search: Optional[str] = None,
        status: Optional[Union[StatusFilter, str]] = None,
        priority: Optional[Union[PriorityFilter, str]] = None,
        tags: Optional[List[str]] = None,
        no_tags: bool = False,
        sort_field: Union[SortField, str] = SortField.PRIORITY,
        sort_order: Union[SortOrder, str] = SortOrder.ASC,
        offset: int = 0,
        limit: int = 100,
    ) -> List[Task]:
        """Execute a paginated query for tasks matching filter, search, and sort criteria.

        Args:
            session (Session): Active database session.
            user_id (str): ID of the user requesting tasks (enforces user isolation).
            search (Optional[str]): Case-insensitive search string matched against title and description. Defaults to None.
            status (Optional[Union[StatusFilter, str]]): Completion status filter ('all', 'pending', 'completed'). Defaults to None.
            priority (Optional[Union[PriorityFilter, str]]): Priority level filter ('all', 'high', 'medium', 'low', 'none'). Defaults to None.
            tags (Optional[List[str]]): List of tag names to filter tasks by (matching any specified tag). Defaults to None.
            no_tags (bool): If True, filters for tasks having no attached tags. Defaults to False.
            sort_field (Union[SortField, str]): Field name to sort results by ('priority', 'title', 'created_at'). Defaults to SortField.PRIORITY.
            sort_order (Union[SortOrder, str]): Direction of sorting ('asc' or 'desc'). Defaults to SortOrder.ASC.
            offset (int): Zero-based pagination offset index. Defaults to 0.
            limit (int): Maximum number of task records to return. Defaults to 100.

        Returns:
            List[Task]: List of root Task instances (parent_id IS NULL) matching criteria with eager-loaded tags and subtasks.
        """
        statement = (
            select(Task)
            .where(Task.user_id == user_id)
            .where(Task.parent_id.is_(None))
            .options(
                selectinload(Task.tags),
                selectinload(Task.subtasks).selectinload(Task.tags),
            )
        )

        if search:
            search_term = f"%{search}%"
            statement = statement.where(
                Task.title.ilike(search_term) | Task.description.ilike(search_term)
            )

        if status and status != "all" and status != StatusFilter.ALL:
            if status == "pending" or status == StatusFilter.PENDING:
                statement = statement.where(Task.completed == False)
            elif status == "completed" or status == StatusFilter.COMPLETED:
                statement = statement.where(Task.completed == True)

        if priority and priority != "all" and priority != PriorityFilter.ALL:
            statement = statement.where(Task.priority == priority)

        if tags:
            statement = (
                statement.join(TaskTag).join(Tag).where(Tag.name.in_(tags))
            )

        if no_tags:
            statement = statement.outerjoin(TaskTag).where(TaskTag.task_id.is_(None))

        # Sorting logic
        if sort_field == "priority" or sort_field == SortField.PRIORITY:
            priority_order = case(
                (Task.priority == Priority.HIGH, 0),
                (Task.priority == Priority.MEDIUM, 1),
                (Task.priority == Priority.LOW, 2),
                (Task.priority == Priority.NONE, 3),
                else_=4,
            )
            if sort_order == "desc" or sort_order == SortOrder.DESC:
                statement = statement.order_by(priority_order.desc(), Task.created_at.desc())
            else:
                statement = statement.order_by(priority_order, Task.created_at.desc())
        elif sort_field == "title" or sort_field == SortField.TITLE:
            col = Task.title.desc() if (sort_order == "desc" or sort_order == SortOrder.DESC) else Task.title.asc()
            statement = statement.order_by(col)
        elif sort_field == "created_at" or sort_field == SortField.CREATED_AT:
            col = Task.created_at.desc() if (sort_order == "desc" or sort_order == SortOrder.DESC) else Task.created_at.asc()
            statement = statement.order_by(col)

        statement = statement.offset(offset).limit(limit)
        return list(session.exec(statement).all())

    def delete(self, session: Session, task: Task) -> None:
        """Delete a Task record from the database session.

        Args:
            session (Session): Active database session transaction.
            task (Task): Task model instance to delete.
        """
        session.delete(task)

    def delete_task_tags(self, session: Session, task_id: str) -> None:
        """Remove all TaskTag relationship join records for a specific task.

        Args:
            session (Session): Active database session.
            task_id (str): Unique UUID string of the task whose tag links should be removed.
        """
        statement = select(TaskTag).where(TaskTag.task_id == task_id)
        for task_tag in session.exec(statement).all():
            session.delete(task_tag)

    def link_task_tag(self, session: Session, task_id: str, tag_id: str) -> None:
        """Create and add a TaskTag join record linking a task to a tag.

        Args:
            session (Session): Active database session.
            task_id (str): Unique UUID string of the task.
            tag_id (str): Unique UUID string of the tag to link.
        """
        session.add(TaskTag(task_id=task_id, tag_id=tag_id))


task_repo = TaskRepository()
