# ChatKit Server — Store Implementations

Source: openai/chatkit-python (Context7, High reputation)

---

## When to Use Which Store

| Store | Use Case |
|-------|----------|
| `InMemoryStore` | Development, tests, single-process servers |
| `PostgresStore` | Production, multi-instance, persistent history |
| Custom `Store[TContext]` | Redis, DynamoDB, MongoDB, multi-tenant isolation |

---

## InMemoryStore (Built-in)

```python
from chatkit.store import InMemoryStore

store = InMemoryStore()
# That's it. No config needed.
```

**Limitations:** Data lost on restart. Not suitable for multi-process deployment. No attachment support (raises `NotImplementedError`).

---

## Full Custom InMemoryStore (with attachments)

```python
from collections import defaultdict
from chatkit.store import Store, NotFoundError
from chatkit.types import ThreadMetadata, ThreadItem, Attachment, Page

class InMemoryStore(Store[dict]):
    def __init__(self):
        self.threads: dict[str, ThreadMetadata] = {}
        self.items: dict[str, list[ThreadItem]] = defaultdict(list)
        self.attachments: dict[str, Attachment] = {}

    async def load_thread(self, thread_id: str, context: dict) -> ThreadMetadata:
        if thread_id not in self.threads:
            raise NotFoundError(f"Thread {thread_id} not found")
        return self.threads[thread_id]

    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
        self.threads[thread.id] = thread

    async def load_threads(self, limit: int, after: str | None, order: str, context: dict) -> Page[ThreadMetadata]:
        threads = list(self.threads.values())
        return self._paginate(threads, after, limit, order,
                              sort_key=lambda t: t.created_at,
                              cursor_key=lambda t: t.id)

    async def load_thread_items(self, thread_id: str, after: str | None, limit: int, order: str, context: dict) -> Page[ThreadItem]:
        items = self.items.get(thread_id, [])
        return self._paginate(items, after, limit, order,
                              sort_key=lambda i: i.created_at,
                              cursor_key=lambda i: i.id)

    async def add_thread_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        self.items[thread_id].append(item)

    async def save_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        items = self.items[thread_id]
        for idx, existing in enumerate(items):
            if existing.id == item.id:
                items[idx] = item
                return
        items.append(item)

    async def load_item(self, thread_id: str, item_id: str, context: dict) -> ThreadItem:
        for item in self.items.get(thread_id, []):
            if item.id == item_id:
                return item
        raise NotFoundError(f"Item {item_id} not found in thread {thread_id}")

    async def delete_thread(self, thread_id: str, context: dict) -> None:
        self.threads.pop(thread_id, None)
        self.items.pop(thread_id, None)

    async def delete_thread_item(self, thread_id: str, item_id: str, context: dict) -> None:
        self.items[thread_id] = [i for i in self.items.get(thread_id, []) if i.id != item_id]

    async def save_attachment(self, attachment: Attachment, context: dict) -> None:
        self.attachments[attachment.id] = attachment

    async def load_attachment(self, attachment_id: str, context: dict) -> Attachment:
        if attachment_id not in self.attachments:
            raise NotFoundError(f"Attachment {attachment_id} not found")
        return self.attachments[attachment_id]

    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
        self.attachments.pop(attachment_id, None)

    def _paginate(self, rows, after, limit, order, sort_key, cursor_key):
        sorted_rows = sorted(rows, key=sort_key, reverse=(order == "desc"))
        start = 0
        if after:
            for idx, row in enumerate(sorted_rows):
                if cursor_key(row) == after:
                    start = idx + 1
                    break
        data = sorted_rows[start:start + limit]
        has_more = start + limit < len(sorted_rows)
        next_after = cursor_key(data[-1]) if has_more and data else None
        return Page(data=data, has_more=has_more, after=next_after)
```

---

## PostgreSQL Store

### Schema

```sql
CREATE TABLE IF NOT EXISTS chatkit_threads (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    data        JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS chatkit_items (
    id          TEXT PRIMARY KEY,
    thread_id   TEXT NOT NULL REFERENCES chatkit_threads(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    data        JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chatkit_items_thread_id ON chatkit_items(thread_id);
CREATE INDEX IF NOT EXISTS idx_chatkit_threads_user_id ON chatkit_threads(user_id);
```

### Implementation (psycopg3)

```python
import psycopg
from psycopg.rows import tuple_row
from chatkit.store import Store, NotFoundError
from chatkit.types import ThreadMetadata, ThreadItem, Attachment, Page

class PostgresStore(Store[RequestContext]):
    def __init__(self, conninfo: str) -> None:
        self._conninfo = conninfo
        self._init_schema()

    def _connection(self):
        return psycopg.connect(self._conninfo)

    def _init_schema(self) -> None:
        with self._connection() as conn, conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chatkit_threads (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL,
                    data JSONB NOT NULL
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chatkit_items (
                    id TEXT PRIMARY KEY,
                    thread_id TEXT NOT NULL REFERENCES chatkit_threads(id) ON DELETE CASCADE,
                    user_id TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL,
                    data JSONB NOT NULL
                )
            """)
            conn.commit()

    async def load_thread(self, thread_id: str, context: RequestContext) -> ThreadMetadata:
        with self._connection() as conn, conn.cursor(row_factory=tuple_row) as cur:
            cur.execute(
                "SELECT data FROM chatkit_threads WHERE id = %s AND user_id = %s",
                (thread_id, context.user_id),
            )
            row = cur.fetchone()
            if row is None:
                raise NotFoundError(f"Thread {thread_id} not found")
            return ThreadMetadata.model_validate(row[0])

    async def save_thread(self, thread: ThreadMetadata, context: RequestContext) -> None:
        payload = thread.model_dump(mode="json")
        with self._connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chatkit_threads (id, user_id, created_at, data)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
                """,
                (thread.id, context.user_id, thread.created_at, payload),
            )
            conn.commit()

    async def load_thread_items(
        self, thread_id: str, after: str | None, limit: int, order: str, context: RequestContext
    ) -> Page[ThreadItem]:
        direction = "ASC" if order == "asc" else "DESC"
        with self._connection() as conn, conn.cursor(row_factory=tuple_row) as cur:
            if after:
                cur.execute(
                    f"SELECT data FROM chatkit_items WHERE thread_id = %s AND user_id = %s "
                    f"AND id > %s ORDER BY created_at {direction} LIMIT %s",
                    (thread_id, context.user_id, after, limit + 1),
                )
            else:
                cur.execute(
                    f"SELECT data FROM chatkit_items WHERE thread_id = %s AND user_id = %s "
                    f"ORDER BY created_at {direction} LIMIT %s",
                    (thread_id, context.user_id, limit + 1),
                )
            rows = cur.fetchall()
        has_more = len(rows) > limit
        data = [ThreadItem.model_validate(r[0]) for r in rows[:limit]]
        next_after = data[-1].id if has_more and data else None
        return Page(data=data, has_more=has_more, after=next_after)

    async def add_thread_item(self, thread_id: str, item: ThreadItem, context: RequestContext) -> None:
        payload = item.model_dump(mode="json")
        with self._connection() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chatkit_items (id, thread_id, user_id, created_at, data) VALUES (%s, %s, %s, %s, %s)",
                (item.id, thread_id, context.user_id, item.created_at, payload),
            )
            conn.commit()

    async def save_item(self, thread_id: str, item: ThreadItem, context: RequestContext) -> None:
        payload = item.model_dump(mode="json")
        with self._connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chatkit_items (id, thread_id, user_id, created_at, data)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
                """,
                (item.id, thread_id, context.user_id, item.created_at, payload),
            )
            conn.commit()

    async def load_item(self, thread_id: str, item_id: str, context: RequestContext) -> ThreadItem:
        with self._connection() as conn, conn.cursor(row_factory=tuple_row) as cur:
            cur.execute(
                "SELECT data FROM chatkit_items WHERE id = %s AND thread_id = %s AND user_id = %s",
                (item_id, thread_id, context.user_id),
            )
            row = cur.fetchone()
            if row is None:
                raise NotFoundError(f"Item {item_id} not found")
            return ThreadItem.model_validate(row[0])

    async def delete_thread(self, thread_id: str, context: RequestContext) -> None:
        with self._connection() as conn, conn.cursor() as cur:
            cur.execute(
                "DELETE FROM chatkit_threads WHERE id = %s AND user_id = %s",
                (thread_id, context.user_id),
            )
            conn.commit()

    async def delete_thread_item(self, thread_id: str, item_id: str, context: RequestContext) -> None:
        with self._connection() as conn, conn.cursor() as cur:
            cur.execute(
                "DELETE FROM chatkit_items WHERE id = %s AND thread_id = %s AND user_id = %s",
                (item_id, thread_id, context.user_id),
            )
            conn.commit()

    # Attachments — implement if needed
    async def save_attachment(self, attachment: Attachment, context: RequestContext) -> None:
        raise NotImplementedError("Attachment storage not configured")

    async def load_attachment(self, attachment_id: str, context: RequestContext) -> Attachment:
        raise NotImplementedError("Attachment storage not configured")

    async def delete_attachment(self, attachment_id: str, context: RequestContext) -> None:
        raise NotImplementedError("Attachment storage not configured")
```

### Connection String Format

```python
# Standard PostgreSQL
conninfo = "postgresql://user:password@host:5432/dbname"

# Neon Serverless (with SSL)
conninfo = "postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# From environment
import os
conninfo = os.environ["DATABASE_URL"]
```
