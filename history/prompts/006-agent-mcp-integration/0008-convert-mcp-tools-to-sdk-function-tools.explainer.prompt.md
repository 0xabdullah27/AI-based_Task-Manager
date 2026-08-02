---
id: "0008"
title: convert-mcp-tools-to-sdk-function-tools
stage: explainer
date: 2026-08-02
surface: backend
model: claude-haiku-4-5-20251001
feature: 006-agent-mcp-integration
branch: chatbot-implementation
user: AbdullahQureshi
command: manual
labels: [explainer, backend, agents, mcp, function-tools, sdk, refactor]
links:
  spec: specs/006-agent-mcp-integration/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - backend/src/services/agent/agent_service.py
  - backend/mcp_server/server.py
  - backend/mcp_server/tools/todo_tools.py
  - backend/src/main.py
  - backend/src/services/conversation_service.py
tests:
  - N/A (analysis only; no code changes made)
---

## Prompt

in the current backend the setup on the chat endpoint is that the agent is talking to the mcp that i have manually created right so what changes do i have to made to create the sdk tools that i can directly use in the agent service as the tool in agent and make the things easier. and also pass the same session to manage the things. and make sure you don't make any changes until i says. and for now keep my project updated on the git and make sure there is no secret leak.

## Response snapshot

**Git**: Committed working state as `3e1ca52` (30 files, +84/-1156) and pushed to `origin/chatbot-implementation`. Secret scan (sk-or-, sk-proj-, AIza, ghp_, postgres URLs, Bearer) found zero matches; `backend/.env` is gitignored and untracked. Note: remote reports repo moved to `https://github.com/0xabdullah27/cloud-native-hackathon-II.git`.

**Current architecture**: `agent_service.py` connects the Agent to the manually-created MCP server via `MCPServerStreamableHttp("todo-mcp", url=http://localhost:8000/mcp/)`. That HTTP round-trip → mounted `mcp_app` (`main.py` mounts at /mcp) → `server.py` tools → `todo_tools.py` which creates a FRESH DB session per call via `get_session()`. user_id is injected into the LLM prompt via a context-string hack. The FastAPI `session` dependency is used only for conversation persistence, NOT for tools.

**Required changes (no code written, per user instruction)**:
1. New module `backend/src/services/agent/tools.py` — define 5 `@function_tool` async tools wrapping `todo_tools.py` logic (or calling `task_service`/`tag_service` directly).
2. Add a context dataclass `AgentContext(session: Session, user_id: str)`; tools take `RunContextWrapper[AgentContext]` as FIRST param so `session` + `user_id` are injected and never exposed to the LLM.
3. `agent_service.py`: replace `mcp_servers=[mcp_server]` with `tools=[add_task, list_tasks, complete_task, delete_task, update_task]`; call `Runner.run(agent, input, context=ctx, max_turns=10)`.
4. Drop the user_id prompt-injection hack and the "ALWAYS pass user_id to every tool call" system-prompt rule; remove `ToolCallInfo` unused import.
5. Optional: remove MCP mount/`mcp_server` entirely (no longer needed) once SDK tools verified.
6. Gotcha: shared sync SQLModel `session` across concurrent async tool calls can raise "session already in transaction"; either disable parallel tool calls (`model_settings={"parallel_tool_calls": False}`) or make each tool call non-blocking on the session.
7. Cleanup flagged: `security.py` has debug `print("Received token:", credentials.credentials)` — logs JWT to console; recommend removal (leak vector, though not a git secret).

## Outcome

- ✅ Impact: clear roadmap to convert HTTP/MCP tool wiring to in-process SDK `@function_tool`s with the SAME DB session passed via `RunContextWrapper`
- 🧪 Tests: N/A (analysis only; awaiting user go-ahead)
- 📁 Files: agent_service.py (modify), new tools.py, todo_tools.py (reuse/refactor), main.py (optional cleanup), security.py (cleanup)
- 🔁 Next prompts: Implement conversion once user approves; then run pytest + manual `test_mcp_client_service.py`
- 🧠 Reflection: `RunContextWrapper` is the canonical way to pass a shared session; sharing one sync session across parallel async tool calls needs care (disable parallel calls or serialize)

## Evaluation notes (flywheel)

- Failure modes observed: none (analysis only)
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment: implement SDK function-tool conversion, run `uv run pytest` and `uv run python test_mcp_client_service.py`
