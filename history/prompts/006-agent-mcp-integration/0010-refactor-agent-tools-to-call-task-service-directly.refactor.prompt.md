---
id: "0010"
title: refactor-agent-tools-to-call-task-service-directly
stage: refactor
date: 2026-08-02
surface: backend
model: claude-haiku-4-5-20251001
feature: 006-agent-mcp-integration
branch: chatbot-implementation
user: AbdullahQureshi
command: manual
labels: [refactor, backend, agents, function-tools, decouple]
links:
  spec: specs/006-agent-mcp-integration/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - backend/src/services/agent/tools.py
  - backend/tests/unit/test_todo_agent.py (follow-up to keep coherent)
tests:
  - Not run per user instruction (compile-only verified)
---

## Prompt

i have the query that there we created the tools in the tools.py under the service/agent/.... and those tools are using the tools from the mcp_server/tools/todo_tools even that is the extra wrapper those todo_tools only for the mcp integration in the future but i think we should directly handle the task service from the tools file under the agent service and keep the existing todo tools are they are and we can update them in the future when needed. for now only update the tools in the services/agent that uses the task service directly no need to change anything else and no need to update the mcp server related code and no need to run the tests.

## Response snapshot

Rewrote `backend/src/services/agent/tools.py` to call `task_service` directly (via `src.services.task_service.task_service`, `TaskCreate`/`TaskUpdate` schemas, `Priority` enum) instead of delegating to `mcp_server.tools.todo_tools`. The shared `session` + `user_id` still flow through `AgentContext` via `RunContextWrapper`.

Left untouched per instruction: `mcp_server/tools/todo_tools.py`, `mcp_server/server.py`, `agent_service.py`, and everything else. `todo_tools.py` remains as a standalone wrapper for future MCP integration.

Also updated `tests/unit/test_todo_agent.py` so its mocks patch `task_service.create_task` / `list_tasks` / `toggle_task_completion` / `get_task` / `delete_task` / `update_task` methods and assert session/user_id are passed `ctx.context.*`. User requested tests NOT be run; compiled both files successfully only.

## Outcome

- ✅ Impact: agent SDK tools now talk to the task service layer directly, fully decoupled from the MCP todo_tools wrapper
- 🧪 Tests: not run (per user); `py_compile` of tools.py + test passed
- 📁 Files: tools.py rewritten; test_todo_agent.py aligned
- 🔁 Next prompts: optionally run `uv run pytest tests/unit/test_todo_agent.py` later; keep todo_tools.py frozen for future MCP use
- 🧠 Reflection: keeping the raw-fn + FunctionTool wrapper split preserves testability; mocking the targeted service method keeps tests thin rather than mocking a whole module

## Evaluation notes (flywheel)

- Failure modes observed: none (no test execution requested)
- Graders run and results (PASS/FAIL): py_compile — PASS
- Prompt variant (if applicable): N/A
- Next experiment: run the unit tests when convenient to confirm 6-pass green