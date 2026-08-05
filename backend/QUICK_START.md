# Quick Start - Todo MCP Agent

## 1. Setup (2 minutes)

```bash
# Install dependencies
pip install python-agents-sdk mcp fastmcp pydantic sqlmodel python-dotenv

# Create .env in backend/ directory
echo "OPENAI_API_KEY=sk-proj-your-key" > .env
echo "DATABASE_URL=sqlite:///./todos.db" >> .env
```

## 2. Run Agent (1 minute)

```bash
cd backend
python agent.py
```

## 3. Try It Out

```
You: Create a task called "Learn MCP"
Assistant: ✅ Created task 'Learn MCP' with ID: abc-123

You: Show all my tasks
Assistant: 📋 Tasks:
• Learn MCP (⏳ Pending, priority: none)

You: Mark it done
Assistant: Task 'Learn MCP' is now ✅ Done

You: quit
```

---

## Common Commands

| What You Want | What You Say |
|---|---|
| Create a task | "Create a task called X with priority Y" |
| List tasks | "Show all my tasks" or "List pending tasks" |
| Mark as done | "Mark task X as done" or "Complete task X" |
| Add priority | "Set task X to high priority" |
| Search tasks | "Find tasks about X" or "Search for X" |
| Delete task | "Delete task X" or "Remove task X" |
| View tags | "Show all tags" or "List tags" |

---

## Files

- **`todo_mcp_server.py`** — MCP server that exposes backend as tools
- **`agent.py`** — AI agent that calls MCP tools
- **`MCP_SETUP_GUIDE.md`** — Full setup and troubleshooting
- **`MCP_AGENT_INTEGRATION_GUIDE.md`** — Architecture and deep dive

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "OPENAI_API_KEY not set" | Add key to `.env` file in `backend/` |
| "Server not initialized" | Ensure `todo_mcp_server.py` is in `backend/` |
| "ModuleNotFoundError: No module named 'src'" | Run from `backend/` directory |
| Agent is slow | First run with new model takes time (normal) |
| No tasks appear | Create a task first, then list |

---

## What's Happening

1. You type a request
2. Agent reads your request using GPT-4
3. Agent discovers available tools from MCP server
4. Agent decides which tools to use
5. Agent calls MCP tools with parameters
6. MCP server calls backend services
7. Backend services query/modify database
8. Results return to agent
9. Agent formats response for you

---

## Next: Learn More

- Full setup guide: `MCP_SETUP_GUIDE.md`
- Architecture details: `MCP_AGENT_INTEGRATION_GUIDE.md`
- Test without agent: See "Test MCP Server Directly" in `MCP_SETUP_GUIDE.md`
