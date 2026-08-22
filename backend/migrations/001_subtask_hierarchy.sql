-- Migration: 001_subtask_hierarchy
-- Feature: Subtasks (parent/child task hierarchy with ordered steps)
-- Applies to: PostgreSQL (Neon Serverless)
--
-- Adds two nullable columns to the existing "task" table:
--   parent_id : self-referential FK to task.id; NULL for root tasks.
--               ON DELETE CASCADE removes subtasks when their parent is deleted.
--   position  : step ordering index among sibling subtasks (1-based); NULL for root tasks.
--
-- Run once against the target database. Safe to re-run only if columns do not exist.

ALTER TABLE task ADD COLUMN IF NOT EXISTS parent_id VARCHAR(36) REFERENCES task(id) ON DELETE CASCADE;
ALTER TABLE task ADD COLUMN IF NOT EXISTS position INTEGER;

CREATE INDEX IF NOT EXISTS ix_task_parent_id ON task(parent_id);
CREATE INDEX IF NOT EXISTS ix_task_position ON task(position);
