# ChatKit Server — Agent Integration Patterns

Source: openai/chatkit-python, openai/openai-chatkit-advanced-samples (Context7, High reputation)

---

## Dependencies

```bash
pip install openai-chatkit openai-agents
```

```python
from chatkit.server import ChatKitServer, ThreadMetadata, UserMessageItem, ThreadStreamEvent
from chatkit.store import InMemoryStore
from chatkit.agents import Agent, AgentContext, Runner, simple_to_agent_input, stream_agent_response
from typing import AsyncIterator
```

---

## Minimal Agent Server (Level 2)

```python
from chatkit.server import ChatKitServer, ThreadMetadata, UserMessageItem, ThreadStreamEvent
from chatkit.store import InMemoryStore
from chatkit.agents import Agent, AgentContext, Runner, simple_to_agent_input, stream_agent_response
from typing import AsyncIterator

# 1. Define the agent
assistant = Agent(
    name="helpful_assistant",
    instructions="You are a helpful AI assistant. Provide clear, concise answers.",
    model="gpt-4o-mini",        # or "gpt-4o", "gpt-4.1", etc.
)

# 2. Subclass ChatKitServer
class MyChatKitServer(ChatKitServer[dict]):
    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: dict,
    ) -> AsyncIterator[ThreadStreamEvent]:

        # Load recent thread history (last 20 items, chronological)
        items_page = await self.store.load_thread_items(
            thread.id, after=None, limit=20, order="asc", context=context
        )

        # Convert ChatKit items → agent input format
        input_items = await simple_to_agent_input(items_page.data)

        # Create agent context (carries store reference + thread info)
        agent_context = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )

        # Run agent streamed → yield ChatKit events
        result = Runner.run_streamed(assistant, input_items, context=agent_context)
        async for event in stream_agent_response(agent_context, result):
            yield event

# 3. Wire to FastAPI
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
from chatkit.server import StreamingResult

app = FastAPI()
store = InMemoryStore()
server = MyChatKitServer(store=store)

@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    result = await server.process(await request.body(), context={})
    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")
```

---

## Agent with Custom RequestContext

When the server needs user identity (for store isolation, tool auth, etc.):

```python
from dataclasses import dataclass

@dataclass
class RequestContext:
    user_id: str
    locale: str = "en"

class MyChatKitServer(ChatKitServer[RequestContext]):
    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: RequestContext,          # typed now
    ) -> AsyncIterator[ThreadStreamEvent]:
        items_page = await self.store.load_thread_items(
            thread.id, after=None, limit=20, order="asc", context=context
        )
        input_items = await simple_to_agent_input(items_page.data)
        agent_context = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )
        result = Runner.run_streamed(assistant, input_items, context=agent_context)
        async for event in stream_agent_response(agent_context, result):
            yield event
```

---

## Agent with Tools

Pass tools list to `Agent(tools=[...])`:

```python
from agents import function_tool, RunContextWrapper
from chatkit.agents import AgentContext

@function_tool(description_override="Search the knowledge base")
async def search_docs(
    ctx: RunContextWrapper[AgentContext],
    query: str,
) -> str:
    results = await my_search_service(query)
    return results

assistant = Agent(
    name="assistant",
    instructions="You help users find information.",
    model="gpt-4o-mini",
    tools=[search_docs],                  # register tools here
)
```

---

## Thread History Loading Patterns

```python
# Last 20, oldest first (standard for agent context)
items_page = await self.store.load_thread_items(
    thread.id, after=None, limit=20, order="asc", context=context
)

# Last 50, newest first (for display)
items_page = await self.store.load_thread_items(
    thread.id, after=None, limit=50, order="desc", context=context
)

# Paginated (next page using cursor)
next_page = await self.store.load_thread_items(
    thread.id, after=items_page.after, limit=20, order="asc", context=context
)
```

---

## Model Selection

| Model | Use When |
|-------|----------|
| `gpt-4o-mini` | Development, low cost, fast |
| `gpt-4o` | Production, complex reasoning |
| `gpt-4.1` | Latest capabilities |
| `gpt-4.1-mini` | Production + cost-efficient |

Set via `Agent(model="gpt-4o-mini")` or override per-run via `Runner.run_streamed(..., model=...)`.

---

## Key Imports Reference

```python
# Core server
from chatkit.server import ChatKitServer, ThreadMetadata, UserMessageItem, ThreadStreamEvent, StreamingResult

# Store
from chatkit.store import Store, InMemoryStore, NotFoundError

# Types
from chatkit.types import ThreadItem, Attachment, Page

# Agents
from chatkit.agents import Agent, AgentContext, Runner, simple_to_agent_input, stream_agent_response

# Tools
from agents import function_tool, RunContextWrapper

# FastAPI
from fastapi import FastAPI, Request, Response, Depends, HTTPException
from fastapi.responses import StreamingResponse
```
