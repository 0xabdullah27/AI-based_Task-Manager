-- Migration: 002_add_due_date
-- Feature: Task Due Date (Optional datetime timestamp for task due date tracking)
-- Applies to: PostgreSQL (Neon Serverless)
--
-- Adds one nullable timestamp column to the existing "task" table:
--   due_date : UTC timestamp with timezone indicating when the task is due; NULL if no due date set.
--
-- Run once against the target database. Safe to re-run if column exists.

ALTER TABLE task ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS ix_task_due_date ON task(due_date);
