# Plan: Remove `none` Priority End-to-End

**Date:** 2026-08-22
**Status:** Approved (user decisions: migrate rows to low, full stack scope, delete NONE entirely)

## Problem

The AI agent's `list_tasks` tool advertised `"none"` as a valid priority filter and defaulted to the string `"None"`. When the LLM omitted or passed `"none"`, only none-priority tasks were returned instead of all tasks. Additionally, `Priority.NONE` meant different things at different layers ("not specified", "stored value", "filter option"), causing ambiguity.

## Invariants

1. No task is ever stored with priority `'none'`.
2. Unspecified priority at **creation** ⇒ stored as `low`.
3. Unspecified priority at **listing/fetching** ⇒ no filter applied (all tasks returned).
4. Update without priority ⇒ existing value unchanged (current behavior preserved).
5. `Priority.NONE` is deleted entirely; Python `None` is the only "unspecified" marker.

## Changes

### Backend
- `backend/src/models/priority.py`: remove `NONE` member; sort order HIGH=0, MEDIUM=1, LOW=2.
- `backend/src/schemas/task.py`: `TaskCreate.priority` default → `Priority.LOW`; remove `NONE` from `PriorityFilter`.
- `backend/src/repositories/task_repo.py`: drop `NONE` branch from sort `CASE`.
- `backend/src/services/task_service.py`: normalize priority filter — `None`, `"all"`, legacy `"none"` ⇒ skip filter (the "None while fetching ⇒ all" rule, defense-in-depth for old clients/agents).
- `backend/src/services/agent/tools.py`: `list_tasks` default `priority=None`; normalize `""/"all"/"none"/"null"` ⇒ no filter; `_parse_priority` maps NONE/NULL/unrecognized ⇒ LOW; docstrings allow only high/medium/low; debug `print()` statements removed.
- `backend/scripts/backfill_priority.py`: one-time migration `UPDATE task SET priority='low' WHERE priority='none'` (run before deploying; no Alembic exists — schema via `create_all`).

### Frontend
- `frontend/src/lib/validations/task.ts`: `priorityValues` → `["low","medium","high"]`; remove `none` from `PRIORITY_CONFIG`, `priorityFilterValues`, labels.
- `frontend/src/components/tasks/TaskForm.tsx`: default priority `low`.
- `frontend/src/app/dashboard/todos/page.tsx`: quick-add creates with `"low"`.
- `frontend/src/app/dashboard/priority/page.tsx`: remove "none" group.
- `frontend/src/app/globals.css` + `frontend/src/lib/priority-colors.ts`: remove `--priority-none-*` variables/entries.
- Tests: `PriorityBadge.test.tsx`, `FilterPanel.test.tsx`, `theme-colors.test.tsx`, `TaskForm.test.tsx`.

### Backend tests
- `test_task_crud_priority.py`, `test_task_crud_sort.py`, `test_task_crud_filter.py`, `test_todo_agent.py`, integration `test_tasks_api_sort.py`.

## Acceptance Checks
- Agent `list_tasks` with no priority returns every task.
- Created tasks default to `low` via REST and agent tool.
- Updating a task without priority leaves it unchanged.
- Backfill script migrates legacy `'none'` rows to `'low'`.
- Backend pytest + frontend jest pass.

## Risks
- Old API consumers POSTing `"none"` get validation errors (accepted: full removal chosen).
- Backfill must run before deploy or legacy rows fail Pydantic reads.
