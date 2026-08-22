# Subtask Feature Plan

## Overview
Add parent/child task hierarchy: a parent task can have multiple ordered subtasks (steps). Subtasks are completable in any order; the parent auto-completes when all subtasks are done. Deleting a parent cascades to its subtasks.

## Decisions (confirmed)
| Decision | Choice |
|---|---|
| Storage approach | Option A: self-referential `parent_id` FK on existing `task` table |
| Nesting depth | One level only (a subtask cannot have its own subtasks) |
| Ordering | Ordered steps via `position` column (Step 1, 2, 3…) |
| Completion order | Any order allowed (numbering is visual guidance only) |
| Completion propagation | Parent auto-completes when ALL subtasks complete; reopens if any subtask reopens |
| Delete behavior | Cascade delete subtasks when parent deleted |

## Step-by-step implementation

### Step 1: Model — `backend/src/models/task.py`
- Add `parent_id: Optional[str]` — FK → `task.id`, indexed, `ON DELETE CASCADE`
- Add `position: Optional[int]` — nullable int, indexed (set only on subtasks)
- Add self-referential relationships: `subtasks` (ordered by position) and `parent`

### Step 2: Migration
No Alembic in repo → provide one-time SQL:
```sql
ALTER TABLE task ADD COLUMN parent_id VARCHAR REFERENCES task(id) ON DELETE CASCADE;
ALTER TABLE task ADD COLUMN position INTEGER;
CREATE INDEX ix_task_parent_id ON task(parent_id);
```

### Step 3: Schemas — `backend/src/schemas/task.py`
- `TaskCreate` / `TaskUpdate`: optional `parent_id`; update accepts optional new `position`
- `TaskRead`: add `parent_id`, `position`, and nested `subtasks: list[TaskRead]` (serialized in step order)
- Validation rules:
  - Parent must exist and belong to the same user
  - A task that already has a `parent_id` cannot become a parent (enforces 1-level depth)

### Step 4: Repository — `backend/src/repositories/task_repo.py`
- Eager-load `subtasks` alongside `tags` in `find_all` / `find_by_id_with_tags`
- List queries return root tasks only (`parent_id IS NULL`); subtasks ride along nested
- Helper: get next `position` for a given parent
- Cascade cleanup of TaskTag rows for children on delete

### Step 5: Service — `backend/src/services/task_service.py`
- Create/update: validate parent ownership + depth rule; assign incremental `position`
- Toggle logic (transactional): on any subtask completion change → recount siblings → all done ⇒ parent `completed = true`; any reopened ⇒ parent `completed = false`
- Delete parent ⇒ delete children (DB cascade) + their tag links

### Step 6: Router — `backend/src/routers/tasks.py`
- Accept `parent_id` on create/update; no new endpoints initially
- Optional later: `GET /api/todos/{id}/subtasks`, reorder endpoint

### Step 7: Agent tools — `backend/src/services/agent/tools.py`
- `add_task`: optional parent (title or ID) to create a step
- `list_tasks`: show subtask progress (e.g., "3/5 done")
- `update_task`: reparenting + completion propagation awareness
- `delete_task`: cascade behavior noted in tool description

### Step 8: Frontend
- Update `Task` type: `parent_id`, `position`, `subtasks[]`
- Tasks provider (`src/providers/tasks-provider.tsx`): flat map internally, derive tree at render
- UI (`src/components/tasks/`): expand/collapse chevron on parents, numbered indented subtask list, "＋ subtask" action, parent shows progress (e.g., 3/5); direct parent completion disabled while subs pending

## Verification
- Backend pytest: create subtask, depth rejection, cross-user parent rejection, auto-complete propagation both directions, cascade delete, position ordering
- Frontend: typecheck + lint pass
- Manual chat test through agent tools

## Risks
- Completion-propagation must be transactional (race on concurrent toggles)
- Recursive `TaskRead` needs loop guard (bounded by 1-level rule)
- Existing rows need backfill defaults (`parent_id NULL`, `position NULL`) — no action needed since both nullable
