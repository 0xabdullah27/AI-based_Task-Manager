---
id: "0009"
title: convert-mcp-tools-to-sdk-function-tools-implemented
stage: green
date: 2026-08-02
surface: backend
model: claude-haiku-4-5-20251001
feature: 006-agent-mcp-integration
branch: chatbot-implementation
user: AbdullahQureshi
command: manual
labels: [green, backend, agents, function-tools, refactor, session-sharing]
links:
  spec: specs/006-agent-mcp-integration/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - backend/src/services/agent/tools.py (new)
  - backend/src/services/agent/agent_service.py
  - backend/mcp_server/tools/todo_tools.py
  - backend/mcp_server/server.py
  - backend/src/routers/chat.py
  - backend/src/core/security.py
  - backend/pyproject.toml
  - backend/tests/unit/test_todo_agent.py
tests:
  - tests/unit/test_todo_agent.py (6 pass)
  - tests/unit/test_user_model.py (10 pass)
  - Full suite: 24 pass, 80 pre-existing errors (missing conftest.py fixture, unrelated)
---

## Prompt

i have updated the remote url now you can push the code and update the git and then make the changes in the code.

(Continuing from PHR 0008: convert the chat agent from HTTP MCP tools to in-process OpenAI Agents SDK function tools, sharing the request DB session.)

## Response snapshot

**Git**: Removed old remote, added `https://github.com/0xabdullah27/cloud-native-hackathon-II.git`, pushed branch.

**Implementation**:
- New `backend/src/services/agent/tools.py`: `AgentContext(session, user_id)` dataclass + 5 raw async tools (callable/testable) + `*_tool` FunctionTool wrappers + `AGENT_TOOLS`.
- `todo_tools.py` refactored: every function now takes a caller-supplied `session` (single source of truth); `get_session()` kept only for the MCP server path.
- `agent_service.py`: dropped `MCPServerStreamableHttp` + MCP_SERVER_URL; Agent now uses `tools=[add_task_tool, ...]` and passes `context=AgentContext(session=session, user_id=user_id)` to both `Runner.run` and `Runner.run_streamed`. Removed the user_id prompt-injection hack and the "ALWAYS pass user_id" system rule. Cleaned unused imports.
- `mcp_server/server.py`: opens its own session via `get_session()` and passes it to the shared functions (still mounted at /mcp for external clients).
- `pyproject.toml`: fixed package include bug `mcpserver*` -> `mcp_server*` (mcp_server was not importable under pytest).
- `security.py`: removed debug `print()` of raw JWT token (leak vector).
- Rewrote stale `test_todo_agent.py` (referenced deleted `src.agents.todo_agent`) to test new SDK tools; verified `FunctionTool` objects are not directly callable, so raw functions are tested and wrappers used by the agent.

## Outcome

- ✅ Impact: agent now uses in-process SDK function tools sharing the request session via RunContextWrapper — no HTTP MCP round-trip, no user_id prompt hack
- 🧪 Tests: 6/6 new tool tests pass; app + agent modules import cleanly; no new failures introduced
- 📁 Files: tools.py new; agent_service, todo_tools, mcp server, chat router, security, pyproject, test_todo_agent modified
- 🔁 Next prompts: run live E2E via `uv run python test_mcp_client_service.py`; optionally drop the /mcp mount if no external clients
- 🧠 Reflection: pre-existing `conftest.py` deletion (commit 5b2a63e) leaves 80 fixture errors unrelated to this change — worth restoring a conftest for the full suite

## Evaluation notes (flywheel)

- Failure modes observed: `FunctionTool` not directly callable (addressed with raw-fn + wrapper split); `mcpserver*` package include typo
- Graders run and results (PASS/FAIL): `uv run pytest tests/unit/test_todo_agent.py` — 6 passed PASS
- Prompt variant (if applicable): N/A
- Next experiment: restore conftest.py to revive full test suite coverage
