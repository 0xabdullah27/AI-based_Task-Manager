# MCP + Agent Integration Setup Guide

This guide walks you through setting up and running the Todo MCP Server and AI Agent.

---

## Prerequisites

1. **Python 3.9+** installed
2. **OpenAI API Key** (for GPT-4o or 3.5-turbo)
3. **Dependencies installed**:
   ```bash
   pip install python-agents-sdk mcp fastmcp pydantic sqlmodel python-dotenv
   ```

---

## Step 1: Create `.env` File

Create a `.env` file in the `backend/` directory with:

```env
OPENAI_API_KEY=sk-proj-your-key-here
DATABASE_URL=sqlite:///./todos.db
```

**Get your API key from:** https://platform.openai.com/account/api-keys

---

## Step 2: Understand the Architecture

```
┌─────────────────────────┐
│    agent.py             │  AI Agent (queries user, calls MCP tools)
└────────────┬────────────┘
             │ MCP Protocol (stdio)
             ▼
┌─────────────────────────┐
│ todo_mcp_server.py      │  MCP Server (exposes services as tools)
└────────────┬────────────┘
             │ Python imports
             ▼
┌─────────────────────────┐
│ src/services/           │  Task & Tag Services
│ ├─ task_service.py      │  (business logic)
│ └─ tag_service.py       │
└────────────┬────────────┘
             │ Database layer
             ▼
┌─────────────────────────┐
│ sqlite:///todos.db      │  SQLite Database
└─────────────────────────┘
```

---

## Step 3: Run the Agent

### Option A: Run Agent Directly (Recommended for first test)

```bash
cd backend
python agent.py
```

You'll see:
```
🔌 Connecting to MCP server...
✅ Connected to todo MCP server

============================================================
📝 TODO ASSISTANT
============================================================
Chat with the assistant to manage your todos.
Type 'quit' or 'exit' to stop.

You:
```

### Example Interactions:

**Create a task:**
```
You: Create a high-priority task: "Fix the login bug"
Assistant: ✅ Created task 'Fix the login bug' with ID: abc-123
```

**List all tasks:**
```
You: Show me all my tasks
Assistant: 📋 Tasks:
• Fix the login bug (⏳ Pending, priority: high)
• Buy groceries (✅ Done, priority: low)
```

**Mark as complete:**
```
You: Mark the first task as done
Assistant: Task 'Fix the login bug' is now ✅ Done
```

**Filter tasks:**
```
You: Show me only pending high-priority tasks
Assistant: 📋 Tasks:
• Fix the login bug (⏳ Pending, priority: high)
```

---

## Step 4: Test MCP Server Directly

To verify the MCP server is working before running the agent:

```bash
# Terminal 1: Start MCP server
cd backend
python todo_mcp_server.py

# Terminal 2: Test with MCP Inspector
npx @modelcontextprotocol/inspector
# Then select: Python stdio
# Command: python
# Arguments: todo_mcp_server.py
# (from the backend directory)
```

You should see the list of available tools:
- `todo_create_task`
- `todo_list_tasks`
- `todo_update_task`
- `todo_delete_task`
- `todo_toggle_task`
- `todo_list_tags`

---

## Step 5: Understanding Tool Parameters

### `todo_create_task`
Creates a new task with optional tags and priority.

**Input:**
```json
{
  "title": "Buy milk",
  "description": "Get 2% milk from the store",
  "priority": "low",
  "tags": ["shopping", "urgent"]
}
```

**Output:**
```
✅ Created task 'Buy milk' with ID: uuid-123
```

### `todo_list_tasks`
List tasks with optional filtering.

**Input:**
```json
{
  "status": "active",
  "priority": "high",
  "search": "bug",
  "tags": ["work"]
}
```

**Output:**
```
📋 Tasks:
• Fix login bug (⏳ Pending, priority: high)
• Optimize API (⏳ Pending, priority: high)
```

### `todo_toggle_task`
Mark a task as done/undone.

**Input:**
```json
{
  "task_id": "uuid-123"
}
```

**Output:**
```
Task 'Fix login bug' is now ✅ Done
```

---

## Troubleshooting

### Error: "OPENAI_API_KEY not set"
- Create/update `.env` file with your key
- Check that the file is in the `backend/` directory

### Error: "Server not initialized"
- Make sure `todo_mcp_server.py` is in the `backend/` directory
- Verify Python can find `src/` module (it should, since both files are in `backend/`)
- Check that database tables are created (run FastAPI backend first or ensure DB exists)

### Error: "ModuleNotFoundError: No module named 'src'"
- Ensure you're running from the `backend/` directory
- The `sys.path.insert(0, os.path.dirname(__file__))` in `todo_mcp_server.py` should handle this

### Agent is slow to respond
- First run with a new model can take 10-15 seconds
- Subsequent runs are faster (tool list is cached)
- On Windows, initial npx startup can add 5-10 seconds

### No tasks appear when listing
- Ensure you've created tasks first
- Check that the database file was created: `todos.db` in `backend/`
- Try creating a task explicitly first: "Create a test task"

---

## How It Works: Under the Hood

### 1. Agent Receives User Request
```
User: "Create a task: Buy milk with high priority"
```

### 2. Agent Calls MCP Server
Agent discovers available tools via MCP protocol and calls `todo_create_task`:
```python
# Agent internally does this:
result = await mcp_server.call_tool(
    "todo_create_task",
    params={
        "title": "Buy milk",
        "priority": "high",
        "tags": None
    }
)
```

### 3. MCP Server Calls Backend Service
```python
# In todo_mcp_server.py
session = get_session()  # Create DB connection
task_create = TaskCreate(title="Buy milk", priority="high", ...)
task = task_service.create_task(session, task_create, user_id="system")
```

### 4. Backend Service Uses Repository Layer
```python
# In task_service.py
def create_task(self, session, task_data, user_id):
    task = Task(user_id=user_id, title=..., priority=...)
    self._task_repo.insert_task(session, task)  # Calls repo
    session.commit()
    return task
```

### 5. Response Returns to User
```
Assistant: ✅ Created task 'Buy milk' with ID: abc-123
```

---

## Architecture Principles

### 1. **Separation of Concerns**
- **Agent** handles natural language & orchestration
- **MCP Server** translates agent calls to backend calls
- **Backend services** contain business logic
- **Database** stores data

### 2. **Session Management**
Each MCP tool creates its own database session:
```python
session = get_session()
try:
    result = task_service.create_task(session, ...)
finally:
    session.close()  # Always close
```

### 3. **Error Handling**
All tools catch exceptions and return helpful messages:
```python
try:
    # Do work
except Exception as e:
    return f"❌ Error: {str(e)}"
```

### 4. **Tool Annotations**
Each tool declares its behavior:
- `readOnlyHint`: True if tool doesn't modify data
- `destructiveHint`: True if tool makes permanent changes
- `idempotentHint`: True if multiple calls have same effect
- `openWorldHint`: True if tool interacts with external systems

---

## Next Steps

1. **Production Deployment**
   - Use PostgreSQL instead of SQLite
   - Implement authentication (user_id from auth system)
   - Add logging for all MCP tool calls
   - Deploy MCP server as separate HTTP service

2. **Enhanced Features**
   - Add task scheduling/reminders
   - Implement subtasks
   - Add collaboration (shared tasks)
   - Create dashboard for visualizing tasks

3. **Advanced Agent Capabilities**
   - Implement multi-turn conversations
   - Add guardrails for destructive operations
   - Build handoff agents (e.g., separate agent for planning)
   - Integrate additional MCP servers

---

## Architecture Decisions

### Why MCP?
✅ Clean separation between agent and backend
✅ Tools are self-describing (agent discovers them)
✅ Reusable across different agents
✅ Easy to add new tools without changing agent code

### Why Session-Per-Tool?
✅ Simpler than managing lifespan context
✅ Safer - each request is isolated
✅ Better for debugging issues
✅ Easier to handle errors and cleanup

### Why Pydantic Models?
✅ Automatic validation of tool inputs
✅ Becomes JSON schema for MCP clients
✅ Type safety
✅ Clear documentation

---

## Support

For issues with:
- **Agent setup**: Check `.env` file and API key validity
- **MCP server**: Verify imports and database connections
- **Backend services**: Check that FastAPI backend is running (or DB is initialized)
- **Database**: Ensure `todos.db` exists and is writable

---

**Last Updated:** 2026-03-08
**MCP Version:** Used via python-agents-sdk
**Python Version:** 3.9+
