"""Priority enum for task prioritization."""
from enum import Enum


class Priority(str, Enum):
    """
    Task priority levels.

    Values are strings for JSON serialization and database storage.
    Sort order is defined separately for query optimization.

    Note: There is no NONE level. Unspecified priority defaults to LOW;
    Python None is used to mean "not specified" (e.g. update leaves value unchanged).
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# Sort order mapping (lower = higher priority in sort)
PRIORITY_SORT_ORDER = {
    Priority.HIGH: 0,
    Priority.MEDIUM: 1,
    Priority.LOW: 2,
}
