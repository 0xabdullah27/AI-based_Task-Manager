---
name: chatkit-server
description: |
  Builder and Guide for creating conversational AI backends using the ChatKit Python SDK (openai-chatkit) with FastAPI. Covers the full progression from a hello world ChatKitServer to agent-powered production systems with streaming, tools, widgets, and PostgreSQL persistence.
  This skill should be used when building or extending a ChatKit server backend — whether starting from scratch, adding agent integration, wiring server tools and widgets, or hardening an existing server for production. Detects existing project structure and auth patterns before generating code.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# ChatKit Server

**Builder + Guide** for conversational AI backends using `openai-chatkit` (Python) + FastAPI.

## What This Skill Does

- Builds `ChatKitServer` from hello world → agent integration → production
- Generates `Store` implementations (InMemory → PostgreSQL)
- Wires FastAPI endpoint with auth and streaming
- Creates server tools (`@function_tool`), widgets, and client tool triggers
- Detects existing project auth (Better Auth JWT, session cookies) and integrates

## What This Skill Does NOT Do

- Build the React/frontend ChatKit UI (that is the frontend's responsibility)
- Configure OpenAI dashboard domain allowlist (manual step, noted in output)
- Implement file upload/attachment storage (out of scope unless explicitly requested)

---

## Before Implementation

Gather context before writing any code:

| Source | What to Look For |
|--------|-----------------|
| **Codebase** | `backend/` structure, existing FastAPI app, auth middleware, database setup, existing `chatkit` imports |
| **Conversation** | Build level (hello world / agent / production), existing store type, model preference, custom tools needed |
| **Skill References** | Patterns from `references/` — use as the authoritative source |
| **User Guidelines** | Project conventions, env var naming, directory structure preferences |

**Key files to read before starting:**
```
backend/main.py or app/main.py   ← existing FastAPI app
backend/auth.py or middleware/   ← existing auth pattern
backend/.env or .env.example     ← env var conventions
```

Only ask user for THEIR requirements. All ChatKit domain knowledge is in `references/`.

---

## Build Levels

Choose the appropriate level based on what the user needs:

```
Level 1: Hello World
  └── ChatKitServer subclass → hardcoded "Hello, world!" response
  └── InMemoryStore
  └── Minimal FastAPI endpoint

Level 2: Agent Integration  ← DEFAULT
  └── Agent with model + instructions
  └── Thread history loading (last 20 items)
  └── Streaming via stream_agent_response
  └── InMemoryStore (swap to PostgreSQL in Level 3)

Level 3: Production
  └── RequestContext with real auth (JWT/session)
  └── PostgreSQL Store
  └── Server tools (@function_tool + progress events)
  └── Widgets (Card, Image, Text)
  └── Client tool triggers (ClientToolCall)
  └── CORS, env vars, error handling
```

**Decision:** If the user says "start simple" or "hello world" → Level 1. If they say "agent" or "conversation" → Level 2. If they say "production" or "auth" or "database" → Level 3. Default to Level 2 when unspecified.

---

## Workflow

### Step 1: Detect Project State
```
Grep for existing ChatKitServer subclass
Grep for /chatkit endpoint
Read existing store implementation if any
Detect auth pattern (Better Auth, JWT headers, session)
```

### Step 2: Install Dependencies
```bash
# Minimum
pip install openai-chatkit

# With agents SDK
pip install openai-chatkit openai-agents

# Verify installed
pip show openai-chatkit
```

### Step 3: Generate Code (by level)

**Level 1 — Hello World** (see `references/patterns.md#level-1`)

```python
from chatkit.server import ChatKitServer, ThreadMetadata, UserMessageItem, ThreadStreamEvent
from chatkit.store import InMemoryStore
from typing import AsyncIterator

class HelloChatKitServer(ChatKitServer[dict]):
    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: dict,
    ) -> AsyncIterator[ThreadStreamEvent]:
        yield self.text_event("Hello, world!")
```

**Level 2 — Agent Integration** (see `references/agent-patterns.md`)

Key structure:
1. Define `Agent(name, instructions, model, tools=[...])`
2. Subclass `ChatKitServer[TContext]`, implement `respond()`
3. In `respond()`: load thread history → convert to agent input → `Runner.run_streamed()` → `stream_agent_response()`

**Level 3 — Production** (see `references/production.md`)

Key additions over Level 2:
1. Real `RequestContext` dataclass with `user_id`, roles, tenant
2. `get_current_user` FastAPI dependency (JWT/cookie)
3. PostgreSQL Store (see `references/store-implementations.md`)
4. Server tools and widgets (see `references/tools-widgets.md`)

### Step 4: Wire FastAPI Endpoint

```python
from fastapi import FastAPI, Request, Response, Depends, HTTPException
from fastapi.responses import StreamingResponse
from chatkit.server import StreamingResult

app = FastAPI()
store = InMemoryStore()          # swap to PostgreSQL for Level 3
server = MyChatKitServer(store)

@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    result = await server.process(await request.body(), context={})
    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")
```

For production with auth — see `references/production.md#fastapi-with-auth`.

### Step 5: Validate

```bash
# Start server
uvicorn app.main:app --reload --port 8000

# Test endpoint responds
curl -X POST http://localhost:8000/chatkit \
  -H "Content-Type: application/json" \
  -d '{"action": "send_message", "thread_id": "test", "content": "hello"}'
```

---

## Key Anti-Patterns to Avoid

| Anti-Pattern | Fix |
|---|---|
| Returning `JSONResponse` directly instead of `Response(content=result.json)` | Use `Response(content=result.json, media_type="application/json")` |
| Caching conversation state in server memory | Fetch state from store on every request |
| Hardcoding OpenAI API key | Use `OPENAI_API_KEY` env var |
| Using `Store` directly in endpoint handler | Always go through `server.process()` |
| Missing `await request.body()` | Always pass `await request.body()` to `server.process()` |
| Not checking `isinstance(result, StreamingResult)` | Always branch on result type |

---

## Reference Files

| File | When to Read |
|------|---|
| `references/core-concepts.md` | ChatKitServer, Store, RequestContext, threads/items overview |
| `references/agent-patterns.md` | Agent setup, thread history loading, streaming patterns |
| `references/store-implementations.md` | InMemoryStore and PostgreSQL Store full implementations |
| `references/tools-widgets.md` | @function_tool, progress events, widgets, ClientToolCall |
| `references/production.md` | Auth integration, CORS, env vars, error handling, security checklist |
