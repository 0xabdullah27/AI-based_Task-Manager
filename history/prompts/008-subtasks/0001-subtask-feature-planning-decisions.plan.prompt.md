---
id: 008-subtasks-0001
title: Subtask feature planning decisions
stage: plan
date: 2026-08-22
surface: project
model: ox-alpha
feature: 008-subtasks
branch: phase-2-agentic-capabilities
user: AbdullahQureshi
command: chat (plan mode)
labels: [subtasks, planning, data-model, hierarchy]
links:
  spec: specs/008-subtasks/
  ticket: none
  adr: suggested (self-referential parent_id design)
  pr: none
files:
  - path: SUBTASK_FEATURE_PLAN.md
    action: created
    note: full step-by-step implementation plan for subtask feature
tests:
  - note: none yet — verification planned via backend pytest and frontend typecheck/lint after implementation
---

## Prompt

User prompts (verbatim, in order):

1. "how does the schema of the tasks looks like i mean what things will be there when we are storing a task"

2. "want to add the sub task feature in the app so tell me how and what ways are there to achive it and what things need to change and update i mean to say that there is hte parent task and it pay have multiple tasks"

3. "want to ask something that will there the proper listed or just the reference for the sub task I mean to say that if there are three sub task as do it and then this and then this one so we have to complete the 1 then 2 and then 3) so in the sub task they can be mixed up and lost their sr no. how should we handle it or will there not the exact steps and the sub task are independent from the other sub task"

4. "before starting implementation create a file in the current root of this project and put the whole plan there step by step as we discuss"

## Response snapshot

Explored current Task model (`backend/src/models/task.py`), schemas, repository, router, agent tools, and frontend structure. Presented two storage approaches:

- **Option A (chosen):** self-referential `parent_id` FK on existing `task` table + `position` column for ordered steps
- **Option B (rejected):** separate `SubTask` table (duplicates all logic)

Confirmed decisions via clarifying questions:
| Decision | Choice |
|---|---|
| Storage | Option A: self-referential FK |
| Nesting depth | One level only |
| Ordering | Ordered steps via `position` column |
| Completion order | Any order allowed |
| Completion propagation | Parent auto-completes when ALL subs done; reopens if any reopens |
| Delete behavior | Cascade delete subtasks |

Created `SUBTASK_FEATURE_PLAN.md` at repo root with 8-step implementation plan:
1. Model changes (`parent_id`, `position`, relationships)
2. Migration SQL (no Alembic; manual ALTER TABLE)
3. Schemas (TaskCreate/TaskUpdate/TaskRead + validation rules)
4. Repository (eager-load subtasks, root-only lists, position helper)
5. Service (ownership/depth validation, transactional completion propagation)
6. Router (accept parent_id on create/update)
7. Agent tools (add/list/update/delete subtask support for AI chat)
8. Frontend (types, provider tree derivation, expand/collapse UI with progress)

## Outcome

- ✅ Impact: Feature fully planned before any code; all architectural decisions confirmed by user; zero code changed yet
- 🧪 Tests: N/A (planning stage) — verification strategy documented in plan
- 📁 Files: SUBTASK_FEATURE_PLAN.md (created); empty feature scaffold at specs/008-subtasks/
- 🔁 Next prompts: "start implementing" → Step 1 model changes, then service/repo/router, agent tools, frontend
- 🧠 Reflection: No Alembic exists in repo, so schema migration is a manual SQL step that must not be forgotten during implementation; completion-propagation must be transactional

## Evaluation notes (flywheel)

- Failure modes observed: create-phr.sh has CRLF line endings and fails under WSL bash ("pipefail: invalid option name"); worked around by stripping CR and running via temp copy
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): implement Step 1+2 (model columns + migration SQL) behind existing pytest suite
