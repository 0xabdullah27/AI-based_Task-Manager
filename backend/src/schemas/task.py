"""Pydantic validation schemas and Enums for Task API requests, responses, and parameters."""
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional, Union, Any, List
from enum import Enum

from src.models.priority import Priority


class StatusFilter(str, Enum):
    """Enumeration of completion status options for task filtering.

    Values:
        ALL ("all"): Return all tasks regardless of completion status.
        PENDING ("pending"): Return only uncompleted tasks.
        COMPLETED ("completed"): Return only completed tasks.
    """
    ALL = "all"
    PENDING = "pending"
    COMPLETED = "completed"


class PriorityFilter(str, Enum):
    """Enumeration of priority level options for task filtering.

    Values:
        ALL ("all"): Return tasks of all priority levels.
        HIGH ("high"): Return high-priority tasks only.
        MEDIUM ("medium"): Return medium-priority tasks only.
        LOW ("low"): Return low-priority tasks only.
    """
    ALL = "all"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class SortField(str, Enum):
    """Enumeration of task fields available for sorting query results.

    Values:
        PRIORITY ("priority"): Sort tasks by priority level (HIGH > MEDIUM > LOW).
        TITLE ("title"): Sort tasks alphabetically by title.
        CREATED_AT ("created_at"): Sort tasks chronologically by creation timestamp.
    """
    PRIORITY = "priority"
    TITLE = "title"
    CREATED_AT = "created_at"


class SortOrder(str, Enum):
    """Enumeration of sort direction options.

    Values:
        ASC ("asc"): Ascending sort order.
        DESC ("desc"): Descending sort order.
    """
    ASC = "asc"
    DESC = "desc"


class TaskCreate(BaseModel):
    """Schema for validating input data when creating a new task.

    Attributes:
        title (str): Required non-empty title (1-200 chars).
        description (Optional[str]): Optional details/notes (up to 2000 chars).
        completed (bool): Initial completion status (default False).
        priority (Priority): Priority level (default Priority.LOW when unspecified).
        tags (list[str]): List of tag names to attach (max 20 tags).
        parent_id (Optional[str]): ID of parent task if creating a subtask.
        due_date (Optional[datetime]): Optional due date and time for the task.
    """
    title: str = Field(..., min_length=1, max_length=200, description="Task title (1-200 chars)")
    description: Optional[str] = Field(None, max_length=2000, description="Task description (max 2000 chars)")
    completed: bool = Field(default=False, description="Completion status flag")
    priority: Priority = Field(default=Priority.LOW, description="Task priority level (defaults to low when unspecified)")
    tags: list[str] = Field(default_factory=list, max_length=20, description="List of tag names")
    parent_id: Optional[str] = Field(None, description="ID of the parent task; set to create a subtask")
    due_date: Optional[datetime] = Field(None, description="Optional due date and time for the task")

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, tags: list[str]) -> list[str]:
        """Validate tag format, convert to lowercase, and deduplicate tags.

        Args:
            tags (list[str]): Raw list of tag strings input by client.

        Returns:
            list[str]: Cleaned, lowercased, deduplicated list of valid tag names.

        Raises:
            ValueError: If any tag exceeds 50 characters or contains whitespace.
        """
        validated: list[str] = []
        for tag in tags:
            tag = tag.strip()
            if not tag:
                continue
            if len(tag) > 50:
                raise ValueError(f"Tag '{tag}' exceeds 50 characters")
            if ' ' in tag:
                raise ValueError(f"Tag '{tag}' contains spaces. Tags must be single words.")
            validated.append(tag.lower())
        return list(dict.fromkeys(validated))


class TaskUpdate(BaseModel):
    """Schema for validating input data when updating an existing task.

    All attributes are optional to support partial updates (PATCH semantics).

    Attributes:
        title (Optional[str]): Updated task title (1-200 chars).
        description (Optional[str]): Updated description (max 2000 chars).
        completed (Optional[bool]): Updated completion flag.
        priority (Optional[Priority]): Updated priority level.
        tags (Optional[list[str]]): Updated tag list (replaces all existing tags if provided).
        parent_id (Optional[str]): Reparent task under parent ID.
        position (Optional[int]): Step position among sibling subtasks.
        due_date (Optional[datetime]): Updated task due date and time.
    """
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Updated title")
    description: Optional[str] = Field(None, max_length=2000, description="Updated description")
    completed: Optional[bool] = Field(None, description="Updated completion status")
    priority: Optional[Priority] = Field(None, description="Updated priority level")
    tags: Optional[list[str]] = Field(None, max_length=20, description="Updated tag list")
    parent_id: Optional[str] = Field(None, description="Reparent task under this parent ID (one level only)")
    position: Optional[int] = Field(None, ge=1, description="New step ordering position among sibling subtasks")
    due_date: Optional[datetime] = Field(None, description="Updated task due date and time")

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, tags: Optional[list[str]]) -> Optional[list[str]]:
        """Validate tag format and convert to lowercase for task updates.

        Args:
            tags (Optional[list[str]]): Raw tag names list or None if tags are unchanged.

        Returns:
            Optional[list[str]]: Processed list of tag names or None.

        Raises:
            ValueError: If any tag exceeds 50 characters or contains whitespace.
        """
        if tags is None:
            return None
        validated: list[str] = []
        for tag in tags:
            tag = tag.strip()
            if not tag:
                continue
            if len(tag) > 50:
                raise ValueError(f"Tag '{tag}' exceeds 50 characters")
            if ' ' in tag:
                raise ValueError(f"Tag '{tag}' contains spaces. Tags must be single words.")
            validated.append(tag.lower())
        return list(dict.fromkeys(validated))


class TaskRead(BaseModel):
    """Schema for serializing a single Task object for API responses.

    Attributes:
        id (str): Unique task identifier UUID.
        user_id (str): Owner user ID.
        title (str): Task title.
        description (Optional[str]): Task description.
        completed (bool): Completion status flag.
        priority (Priority): Task priority.
        parent_id (Optional[str]): Parent task ID if this task is a subtask.
        position (Optional[int]): Step ordering index among sibling subtasks.
        due_date (Optional[datetime]): Task due date timestamp (NULL if unspecified).
        tags (list[str]): List of tag name strings attached to this task.
        subtasks (list[TaskRead]): Child tasks ordered by step position.
        created_at (datetime): UTC creation timestamp.
        updated_at (Optional[datetime]): UTC last updated timestamp.
    """
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    priority: Priority
    parent_id: Optional[str] = None
    position: Optional[int] = None
    due_date: Optional[datetime] = None
    tags: list[str] = Field(default_factory=list)
    subtasks: list["TaskRead"] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime]

    @field_validator('tags', mode='before')
    @classmethod
    def serialize_tags(cls, tags: Any) -> list[str]:
        """Convert Tag model instances or raw strings to a list of tag name strings.

        Args:
            tags (Any): List of Tag objects, list of string tag names, or empty collection.

        Returns:
            list[str]: Extracted list of tag names.
        """
        if not tags:
            return []
        if isinstance(tags, list) and all(isinstance(t, str) for t in tags):
            return tags
        if isinstance(tags, list):
            return [t.name if hasattr(t, 'name') else str(t) for t in tags]
        return []

    @field_validator('subtasks', mode='before')
    @classmethod
    def serialize_subtasks(cls, subtasks: Any) -> list[Any]:
        """Normalize the subtasks relationship for nested serialization.

        Args:
            subtasks (Any): List of Task model instances, dicts, or empty collection.

        Returns:
            list[Any]: Iterable payload for recursive TaskRead validation.
        """
        if not subtasks:
            return []
        return list(subtasks)


TaskRead.model_rebuild()


class TaskListResponse(BaseModel):
    """Schema for wrapping task query results with count metadata.

    Attributes:
        tasks (list[TaskRead]): List of task items matching query criteria.
        total (int): Total number of tasks owned by user across all statuses/filters.
        filtered (int): Count of tasks matching applied search and filter parameters.
    """
    tasks: list[TaskRead]
    total: int
    filtered: int


class TagRead(BaseModel):
    """Schema for serializing tag data in response models.

    Attributes:
        id (str): Unique tag UUID.
        name (str): Tag name.
        task_count (int): Number of tasks associated with this tag.
    """
    id: str
    name: str
    task_count: int


class TagListResponse(BaseModel):
    """Schema for wrapping tag list responses.

    Attributes:
        tags (list[TagRead]): List of tag summaries.
    """
    tags: list[TagRead]
