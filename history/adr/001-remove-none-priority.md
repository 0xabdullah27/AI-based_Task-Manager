# ADR-001: Remove `none` Task Priority

**Date:** 2026-08-22
**Status:** Accepted
**Scope:** Backend + Frontend (breaking change to priority enum)

## Context

`Priority.NONE` was ambiguous: it meant "not specified" at the schema layer, a stored value in the DB, and a filter option. This broke agent listing — an unspecified or `"none"` priority on `list_tasks` filtered instead of returning all tasks, and tasks without urgency were stored as a meaningless fourth level.

## Decision

1. Delete `Priority.NONE` entirely; only `low`, `medium`, `high` exist.
2. **Creation:** unspecified priority defaults to `LOW` (schema, model, and agent `_parse_priority`).
3. **Listing:** unspecified / `"all"` / legacy `"none"` priority means *no filter* — normalized once in `TaskService._normalize_priority_filter`, with a matching guard in the agent tools.
4. **Update:** omitted priority leaves the stored value unchanged (unchanged behavior).
5. Legacy rows are migrated via one-time backfill (`backend/scripts/backfill_priority.py`: `'none'` → `'low'`).

## Rationale for Layer Placement

Translation lives in the **service layer**, not the repository or API layer, because both entry points (REST router and agent tools) funnel through `task_service`. One normalization point covers all callers; repositories stay generic.

## Consequences

- Old clients POSTing `"none"` receive 422 validation errors.
- Backfill must run before deploy, or legacy rows fail Pydantic reads.
- Sort order simplifies to HIGH > MEDIUM > LOW everywhere.

## Alternatives Considered

- Keep `NONE` as an internal sentinel enum member (rejected: user chose full removal; two meanings of "unspecified" persist).
