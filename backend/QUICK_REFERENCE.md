# 🎯 Quick Reference: Key Concepts

## 1. Import Structure - Why Some Imports "Do Nothing"

### The Pattern You Noticed

```python
# File: src/auth/dependencies.py
from src.core.security import get_current_user, security  # noqa: F401
```

**This is NOT doing nothing!** It's a **re-export** for backward compatibility.

### Why?

```
Old code (6 months ago):
  from src.auth.dependencies import get_current_user

New code (today):
  from src.core.security import get_current_user

Problem:
  Moving get_current_user breaks all old imports!

Solution:
  Re-export from old location → both work!
```

### All Re-exports

| Old Import Location | New Canonical Location | Purpose |
|---------------------|----------------------|---------|
| `src/auth/dependencies.py` | `src/core/security.py` | Auth dependencies |
| `src/db/database.py` | `src/core/database.py` | Database engine |

---

## 2. Conversation History - Complete Flow

### Database Schema

```
┌─────────────────────────────────────────┐
│          CONVERSATION TABLE             │
├─────────────────────────────────────────┤
│ id (PK)         │ UUID                  │
│ user_id (FK)    │ → user.id             │
│ created_at      │ When started          │
│ updated_at      │ Last message time     │
└─────────────────────────────────────────┘
           │
           │ 1-to-many
           ▼
┌─────────────────────────────────────────┐
│            MESSAGE TABLE                │
├─────────────────────────────────────────┤
│ id (PK)         │ UUID                  │
│ conversation_id │ → conversation.id     │
│ user_id         │ Denormalized          │
│ role            │ "user" or "assistant" │
│ content         │ Message text          │
│ created_at      │ When sent             │
└─────────────────────────────────────────┘
```

### How AI Gets Previous Messages

```
Request 1: "Add buy milk"
  ↓
  CREATE conversation
  INSERT message (role="user", content="Add buy milk")
  AI processes → "Created task: Buy milk"
  INSERT message (role="assistant", content="Created...")
  ↓
  Response: {"conversation_id": "abc-123", ...}

Request 2: "Also add eggs" (with conversation_id="abc-123")
  ↓
  FETCH conversation by ID
  FETCH messages WHERE conversation_id="abc-123"
    → [
         {role: "user", content: "Add buy milk"},
         {role: "assistant", content: "Created..."}
       ]
  INSERT message (role="user", content="Also add eggs")
  BUILD messages array for AI:
    → [
        {role: "user", content: "Add buy milk"},
        {role: "assistant", content: "Created..."},
        {role: "user", content: "[System: user_id=xyz]\n\nAlso add eggs"}
      ]
  AI processes WITH FULL CONTEXT
  INSERT message (role="assistant", content="Created task: Eggs")
  ↓
  Response: {"conversation_id": "abc-123", ...}
```

### Key Points

1. **Every message is stored** in database (PostgreSQL)
2. **AI sees last 50 messages** (prevents overflow)
3. **System context added** to every request (user_id)
4. **Server holds NO state** in memory (stateless)
5. **User isolation enforced** (WHERE user_id = ?)

---

## 3. How AI Calls MCP Tools

### The Chain

```
AI Agent (Gemini)
    ↓ (decides to call tool)
MCP Client (in agent_service.py)
    ↓ (HTTP request)
MCP Server (at /mcp/ endpoint)
    ↓ (calls tool function)
Tool Implementation (todo_tools.py)
    ↓ (calls service layer)
Task Service (task_service.py)
    ↓ (calls repository)
Task Repository (task_repo.py)
    ↓ (SQL query)
Database (PostgreSQL)
```

### Example: "Add buy milk"

```python
# 1. AI decides to call add_task
# AI: "I need to create a task. I'll call add_task(title='Buy milk')"

# 2. MCP Client sends request
mcp_server.call_tool("add_task", arguments={
    "user_id": "yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI",
    "title": "Buy milk"
})

# 3. MCP Server executes tool
@mcp.tool(name="add_task")
async def add_task(user_id: str, title: str) -> str:
    from mcp_server.tools.todo_tools import add_task as _add_task
    result = _add_task(user_id=user_id, title=title)
    return json.dumps(result)

# 4. Tool calls service layer
def add_task(user_id, title, description=None):
    task = Task(
        user_id=user_id,
        title=title,
        description=description
    )
    session.add(task)
    session.commit()
    return {"task_id": task.id, "title": task.title}

# 5. Result flows back
# AI receives: {"task_id": "42", "title": "Buy milk"}
# AI generates: "I've created task: 'Buy milk' (ID: 42)"
```

---

## 4. Folder Responsibilities

```
src/
├── api/          → Shared API dependencies (CurrentUser, DbSession types)
├── auth/         → Re-exports only (backward compat)
├── core/         → Core infrastructure (config, database, security)
├── db/           → Re-exports only (backward compat)
├── exceptions/   → Custom exceptions + HTTP handlers
├── middleware/   → Request pipeline (CORS, logging, error handling, rate limit)
├── models/       → Database tables (SQLModel classes)
├── repositories/ → SQL queries only (no business logic)
├── routers/      → HTTP endpoints (request/response handling)
├── schemas/      → Pydantic models (request validation, response shaping)
├── services/     → Business logic (orchestrates repos, calls AI)
├── utils/        → Helper functions (uuid, datetime)
└── main.py       → FastAPI app, middleware stack, route registration

mcp_server/
├── server.py     → MCP server definition (5 tools)
└── tools/
    └── todo_tools.py → Actual tool implementations
```

---

## 5. Request Lifecycle (Step by Step)

### Example: POST /api/chat

```
┌─────────────────────────────────────────────────────────┐
│ 0. Frontend sends request                               │
│    POST http://localhost:8000/api/chat                  │
│    Headers: {                                           │
│      "Authorization": "Bearer eyJhbGciOi...",           │
│      "Content-Type": "application/json"                 │
│    }                                                    │
│    Body: {"message": "Add buy milk", "conversation_id": null}
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 1. Middleware: logging_middleware                       │
│    - Logs: "POST /api/chat from 127.0.0.1"              │
│    - Starts timer for X-Process-Time                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Middleware: error_handler_middleware                 │
│    - Wraps request in try/catch                         │
│    - Converts exceptions to HTTP responses              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Middleware: CORS                                     │
│    - Checks Origin header                               │
│    - Adds: Access-Control-Allow-Origin: http://localhost:3000
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Dependency: get_current_user                         │
│    - Extracts JWT from Authorization header             │
│    - Verifies JWT using JWKS from Better Auth           │
│    - Returns: user_id = "yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI"
│    - If invalid: raises 401 Unauthorized                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Dependency: get_session                              │
│    - Returns SQLModel database session                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Router: chat.router                                  │
│    @router.post("/chat")                                │
│    async def chat(chat_request, user_id, session):      │
│      - chat_request.message = "Add buy milk"            │
│      - chat_request.conversation_id = null              │
│      - user_id = "yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI"     │
│      - Calls: handle_chat(...)                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Service: agent_service.handle_chat()                 │
│    a) Get or create conversation                        │
│       - conversation_id is null → CREATE NEW            │
│       - conversation = Conversation(user_id=user_id)    │
│       - conversation.id = "eae83ca5-cb7f-..."           │
│                                                         │
│    b) Fetch history                                     │
│       - SELECT * FROM message WHERE conversation_id=... │
│       - Returns: [] (empty, new conversation)           │
│                                                         │
│    c) Store user message                                │
│       - INSERT INTO message (...)                       │
│                                                         │
│    d) Build messages for AI                             │
│       messages = [                                      │
│         {                                               │
│           "role": "user",                               │
│           "content": "[System: user_id='yKCN7...']\n\nAdd buy milk"
│         }                                               │
│       ]                                                 │
│                                                         │
│    e) Run AI agent                                      │
│       - Connect to MCP server at /mcp/                  │
│       - Send messages to Gemini 2.5 Flash               │
│       - AI calls: add_task(user_id, title="Buy milk")   │
│       - AI generates response                           │
│                                                         │
│    f) Store assistant response                          │
│       - INSERT INTO message (...)                       │
│                                                         │
│    g) Return                                            │
│       - ChatResponse(conversation_id, response)         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 8. MCP Server (at /mcp/)                                │
│    @mcp.tool(name="add_task")                           │
│    async def add_task(user_id, title):                  │
│      - Calls: mcp_server.tools.todo_tools.add_task()    │
│      - Returns: JSON string                             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 9. Tool Implementation                                  │
│    def add_task(user_id, title, description=None):      │
│      - task = Task(user_id=user_id, title=title)        │
│      - session.add(task)                                │
│      - session.commit()                                 │
│      - Returns: {"task_id": "42", "title": "Buy milk"}  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 10. Response flows back                                 │
│     AI receives tool result                             │
│     AI generates: "I've created task: 'Buy milk' (ID: 42)"
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 11. Router returns response                             │
│     return {"conversation_id": "eae83ca5...",           │
│             "response": "I've created task: 'Buy milk'"}│
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 12. Frontend receives and updates UI                    │
│     - Displays: "I've created task: 'Buy milk' (ID: 42)"│
│     - Stores conversation_id for next request           │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Architecture Changes (Branch: enhance-code-architecture)

### What Changed

1. **Consolidated security**
   - Old: `src/auth/jwt_handler.py` + `src/auth/dependencies.py`
   - New: `src/core/security.py` (single source of truth)
   - Old files re-export for backward compat

2. **Consolidated database**
   - Old: `src/db/database.py`
   - New: `src/core/database.py`
   - Old file re-exports

3. **Added MCP server**
   - New: `mcp_server/` folder
   - Mounts at `/mcp/` in FastAPI
   - AI agent connects via HTTP

4. **Added conversation models**
   - New: `src/models/conversation.py`
   - New: `src/models/message.py`
   - Enables chat history persistence

5. **Added chat endpoints**
   - New: `src/routers/chat.py`
   - `POST /api/chat` (non-streaming)
   - `POST /api/chat/stream` (SSE streaming)
   - `GET /api/chat/history`

### Why These Changes

- **Cleaner architecture**: Core infrastructure in one place
- **Better separation**: Auth, DB, config all in `core/`
- **AI integration**: MCP server for tool calling
- **Conversation support**: Full chat history management
- **Backward compat**: Old imports still work

---

## 7. Common Questions

### Q: "Why import from src.core.security and then do nothing?"

**A**: We're not doing nothing! We're **re-exporting** so old code doesn't break.

```python
# File: src/auth/dependencies.py
from src.core.security import get_current_user  # Re-export

# Now both work:
from src.auth.dependencies import get_current_user  # Old way
from src.core.security import get_current_user      # New way
```

### Q: "How does AI remember previous messages?"

**A**: AI doesn't remember! **We send full history** with every request.

```python
# Every request:
history = db.get_messages(conversation_id, limit=50)
messages = history + [{"role": "user", "content": new_message}]
ai_response = await agent.run(messages)
```

### Q: "Where is conversation state stored?"

**A**: **Database only** (PostgreSQL). Server holds ZERO state in memory.

```
Memory: Empty (stateless)
Database: All conversations + messages
```

### Q: "What if two users have same conversation_id?"

**A**: Impossible! Query always includes user_id:

```sql
SELECT * FROM conversation
WHERE id = 'abc-123' AND user_id = 'yKCN7...'  -- User isolation
```

### Q: "How does AI know which user to create tasks for?"

**A**: **System context** in every message:

```python
messages.append({
    "role": "user",
    "content": f"[System context: The current user_id is '{user_id}'. Always pass this user_id to every tool call.]\n\n{message}"
})
```

AI reads this and knows to pass `user_id` to every tool call.

---

## 8. Testing the Flow

### Get Conversation History

```bash
curl -X GET http://localhost:8000/api/chat/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "conversation_id": "eae83ca5-cb7f-4a63-92df-d3606ebbefa5",
  "messages": [
    {"role": "user", "content": "Add buy milk"},
    {"role": "assistant", "content": "Created task: Buy milk (ID: 42)"},
    {"role": "user", "content": "Also add eggs"},
    {"role": "assistant", "content": "Created task: Eggs (ID: 43)"}
  ]
}
```

### Send New Message

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show my tasks",
    "conversation_id": "eae83ca5-cb7f-4a63-92df-d3606ebbefa5"
  }'
```

AI receives:
```
[
  {"role": "user", "content": "Add buy milk"},
  {"role": "assistant", "content": "Created task: Buy milk (ID: 42)"},
  {"role": "user", "content": "Also add eggs"},
  {"role": "assistant", "content": "Created task: Eggs (ID: 43)"},
  {"role": "user", "content": "[System: user_id=xyz]\n\nShow my tasks"}
]
```

AI calls `list_tasks(user_id="xyz")` and responds with task list.

---

**Need more clarification?** Check `ARCHITECTURE_DEEP_DIVE.md` for complete details!
