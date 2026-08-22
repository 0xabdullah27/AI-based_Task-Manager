"""One-time backfill: migrate legacy priority='none' tasks to 'low'.

Run once before deploying the remove-none-priority change:
    python -m scripts.backfill_priority

Uses a Core-level UPDATE statement so legacy 'none' values are never
hydrated into Priority enum objects (which would raise LookupError).
"""
import logging

from sqlalchemy import update

from src.core.database import engine
from src.models.task import Task

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def backfill() -> int:
    """Update all tasks with priority 'none' to 'low'. Returns affected row count."""
    with engine.begin() as conn:
        result = conn.execute(
            update(Task).where(Task.priority == "none").values(priority="low")
        )
        updated = result.rowcount or 0
    logger.info("Backfilled %d task(s) from 'none' to 'low'", updated)
    return updated


if __name__ == "__main__":
    backfill()
