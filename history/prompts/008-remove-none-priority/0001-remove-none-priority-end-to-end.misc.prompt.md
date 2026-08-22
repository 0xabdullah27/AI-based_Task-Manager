---
id: 0001
title: Remove none priority end to end
stage: misc
date: 2026-08-22
surface: agent
model: ox-alpha
feature: 008-remove-none-priority
branch: phase-2-agentic-capabilities
user: Abdullah Qureshi
command: manual
labels: ["priority", "agent-tools", "breaking-change", "data-migration", "backend", "frontend"]
links:
  spec: specs/008-remove-none-priority/plan.md
  ticket: null
  adr: history/adr/001-remove-none-priority.md
  pr: null
files:
 - backend/src/models/priority.py
 - backend/src/models/task.py
 - backend/src/schemas/task.py
 - backend/src/repositories/task_repo.py
 - backend/src/services/task_service.py
 - backend/src/services/agent/tools.py
 - backend/mcp_server/tools/todo_tools.py
 - backend/src/routers/tasks.py
 - backend/scripts/backfill_priority.py
 - frontend/src/lib/validations/task.ts
 - frontend/src/lib/priority-colors.ts
 - frontend/src/lib/constants/priorities.ts
 - frontend/src/components/tasks/TaskForm.tsx
 - frontend/src/components/tasks/PriorityBadge.tsx (via config)
 - frontend/src/app/dashboard/todos/page.tsx
 - frontend/src/app/dashboard/priority/page.tsx
 - frontend/src/app/dashboard/components/PriorityTabs.tsx
 - frontend/src/app/globals.css
tests:
 - backend/tests/unit/test_task_crud_priority.py
 - backend/tests/unit/test_task_crud_sort.py
 - backend/tests/unit/test_task_crud_filter.py
 - backend/tests/unit/test_todo_agent.py
 - backend/tests/integration/test_tasks_api_sort.py
 - backend/tests/integration/test_tasks_api_priority.py
 - backend/tests/integration/test_tasks_api_filter.py
---

## Prompt

there is the issue while the priority is none that when fetching with the agent i mean when the agent fetch the list tools and it does not pass anything to the tool so it default to none but there the none is the specific value and we dont get the reuqired output ... so i want to fully remove the none priority to low and when creating a task the priority will be defualt to low and when updating the task so keep the existing ... and when fetching or listing hte tasks so the default will be all task. so every where the None mean different we don't set the value to all or low at the upper layer like there is the tool list_tasks in the tools for the agent so we keep the priority to None but behind the scn when we are actually ftching may be in the service layer or datebase layer(tell me where and why to do this) and in the lower layer of the application when fetching we put this law that None while creting refer to the low and None while fetching refer to the all

## Response snapshot

Removed `Priority.NONE` end-to-end. Creation defaults to LOW (schema/model/agent parse). Listing normalizes unspecified/"all"/legacy "none" to no filter in `TaskService._normalize_priority_filter` plus a guard in agent `_normalize_priority_filter`. Update behavior unchanged. Added one-time backfill script (`backend/scripts/backfill_priority.py`) migrating legacy 'none' rows to 'low'. Frontend: removed "none" from enum, config, filters, forms, tabs, CSS variables; defaults now "low". Plan documented in `specs/008-remove-none-priority/plan.md`; decision recorded in ADR-001.

## Outcome

- ✅ Impact: Agent `list_tasks` without priority now returns all tasks; every created task has a concrete stored priority; single normalization choke point in the service layer covers REST + agent + MCP callers.
- 🧪 Tests: Backend suite green (123 passed; only pre-existing LLM-dependent chat checkpoint failures remain, verified failing on clean tree). Frontend `tsc --noEmit` clean; jest blocked by pre-existing missing deps (ts-node, msw/node).
- 📁 Files: ~20 modified/created across backend and frontend.
- 🔁 Next prompts: Run backfill script against Neon before deploy; fix frontend test infra (install ts-node/msw); update THEME.md/spec docs referencing none priority.
- 🧠 Reflection: Ambiguity arose from ONE value meaning three things ("unspecified", "stored level", "filter option"). Resolving each meaning explicitly — default-to-low on create, no-filter on fetch, keep-on-update — removed the whole class of bugs.

## Evaluation notes (flywheel)

- Failure modes observed: Agent LLM passing "none"/"None" strings as filters because docstrings advertised them as valid.
- Graders run and results (PASS/FAIL): PASS — pytest 123 passed; tsc clean.
- Prompt variant (if applicable): None
- Next experiment (smallest change to try): Constrain the agent tool parameter to an enum ("high"/"medium"/"low") in the JSON schema so the LLM physically cannot pass other values.
