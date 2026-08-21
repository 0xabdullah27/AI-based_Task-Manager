"""Base exception classes for the todo application domain."""
from typing import Optional


class TodoAppException(Exception):
    """Base exception class for all domain-specific application exceptions."""

    pass


class TaskNotFoundError(TodoAppException):
    """Raised when a requested task record is not found or unauthorized."""

    def __init__(self, task_id: str) -> None:
        self.task_id = task_id
        super().__init__(f"Task with id '{task_id}' not found")


class TagNotFoundError(TodoAppException):
    """Raised when a requested tag record is not found or unauthorized."""

    def __init__(self, tag_id: str) -> None:
        self.tag_id = tag_id
        super().__init__(f"Tag with id '{tag_id}' not found")


class ConversationNotFoundError(TodoAppException):
    """Raised when a requested chat conversation record is not found or unauthorized."""

    def __init__(self, conversation_id: str) -> None:
        self.conversation_id = conversation_id
        super().__init__(f"Conversation with id '{conversation_id}' not found")


class UnauthorizedError(TodoAppException):
    """Raised when an operation violates authorization or row-level ownership rules."""

    def __init__(self, message: str = "Unauthorized access") -> None:
        super().__init__(message)


class ValidationError(TodoAppException):
    """Raised when input validation fails in domain logic."""

    def __init__(self, message: str, field: Optional[str] = None) -> None:
        self.field = field
        super().__init__(message)
