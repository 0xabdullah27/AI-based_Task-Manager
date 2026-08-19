# ChatKit Server — Core Concepts

Source: openai/chatkit-python (Context7, High reputation)

---

## Package

```bash
pip install openai-chatkit          # SDK only
pip install openai-chatkit openai-agents   # SDK + Agents SDK
```

Import root: `chatkit.server`, `chatkit.store`, `chatkit.types`, `chatkit.agents`, `chatkit.widgets`

---

## ChatKitServer

The central class. Subclass it and implement `respond()`.

```python
from chatkit.server import ChatKitServer, ThreadMetadata, UserMessageItem, ThreadStreamEvent
from typing import AsyncIterator

class MyChatKitServer(ChatKitServer[TContext]):
    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: TContext,                  # your RequestContext type
    ) -> AsyncIterator[ThreadStreamEvent]:
        yield self.text_event("response text")
```

`TContext` is YOUR context type — a dataclass, dict, or Pydantic model. It is passed from `server.process(body, context)`.

### `server.process(body, context)`

- Accepts raw request body bytes + your context
- Handles all ChatKit protocol internally (thread creation, item storage, protocol messages)
- Returns `StreamingResult` (SSE) or a JSON result
- **Always call `await server.process(await request.body(), context)`**

---

## Store Interface

Stores persist threads and items. Must implement `Store[TContext]`.

### Required Methods

```python
async def load_thread(thread_id, context) -> ThreadMetadata
async def save_thread(thread, context) -> None
async def load_threads(limit, after, order, context) -> Page[ThreadMetadata]
async def load_thread_items(thread_id, after, limit, order, context) -> Page[ThreadItem]
async def add_thread_item(thread_id, item, context) -> None
async def save_item(thread_id, item, context) -> None
async def load_item(thread_id, item_id, context) -> ThreadItem
async def delete_thread(thread_id, context) -> None
async def delete_thread_item(thread_id, item_id, context) -> None
async def save_attachment(attachment, context) -> None
async def load_attachment(attachment_id, context) -> Attachment
async def delete_attachment(attachment_id, context) -> None
```

### Built-in: InMemoryStore

```python
from chatkit.store import InMemoryStore

store = InMemoryStore()   # dict-backed, no persistence, safe for dev/testing
```

### NotFoundError

```python
from chatkit.store import NotFoundError

raise NotFoundError(f"Thread {thread_id} not found")
```

---

## RequestContext

A small per-request object you define. Passed to all Store methods and the `respond()` method.

```python
from dataclasses import dataclass

@dataclass
class RequestContext:
    user_id: str
    locale: str = "en"
    # Add any app-specific fields: org_id, plan, roles, etc.
```

Built in FastAPI:
```python
context = RequestContext(user_id=authenticated_user_id, locale="en")
result = await server.process(await request.body(), context)
```

---

## Threads and Items

**Thread** — a single conversation. Contains ordered history.

```python
from chatkit.types import ThreadMetadata

# ThreadMetadata fields (managed by ChatKit internally):
# id: str
# created_at: datetime
# title: str | None
# status: "active" | "read_only"
```

**ThreadItem** — one element in a thread. Types include:
- `UserMessageItem` — user's message
- `AssistantMessageItem` — assistant response text
- `WidgetItem` — interactive UI widget
- `ToolCallItem` — tool invocation

**Page** — paginated result:
```python
from chatkit.types import Page

page = await store.load_thread_items(thread_id, after=None, limit=20, order="asc", context=ctx)
# page.data: list[ThreadItem]
# page.has_more: bool
# page.after: str | None  (cursor for next page)
```

---

## Single Endpoint Contract

ChatKit uses **one endpoint** for all operations (send message, load history, create thread, etc.). The protocol is managed internally by `server.process()`.

```
POST /chatkit
Content-Type: application/json
→ Returns: text/event-stream (streaming) OR application/json
```

The frontend `useChatKit` hook points to this single URL.
