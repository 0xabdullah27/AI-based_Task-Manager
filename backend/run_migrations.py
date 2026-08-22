"""One-off migration runner: applies pending SQL migrations in migrations/ to the configured database."""
import logging
from pathlib import Path

from sqlalchemy import text

from src.core.database import engine

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def main() -> None:
    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        logger.info("No migration files found")
        return

    with engine.connect() as conn:
        for path in sql_files:
            logger.info("Applying %s ...", path.name)
            conn.execute(text(path.read_text(encoding="utf-8")))
        conn.commit()

        cols = conn.execute(text(
            "SELECT column_name, data_type FROM information_schema.columns "
            "WHERE table_name='task' AND column_name IN ('parent_id','position') "
            "ORDER BY column_name"
        )).fetchall()
        idxs = conn.execute(text(
            "SELECT indexname FROM pg_indexes WHERE tablename='task' "
            "AND indexname IN ('ix_task_parent_id','ix_task_position') "
            "ORDER BY indexname"
        )).fetchall()

    logger.info("Columns: %s", [tuple(c) for c in cols])
    logger.info("Indexes: %s", [r[0] for r in idxs])
    logger.info("Migration applied successfully")


if __name__ == "__main__":
    main()
