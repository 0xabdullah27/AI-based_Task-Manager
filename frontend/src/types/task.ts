/**
 * Task type definitions
 * Spec: 001-todo-web-crud, 002-todo-organization-features
 * Task: T079, T016-T020
 */

import type { Priority, TaskFilters, SortField, SortOrder } from "@/lib/validations/task";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  tags: string[];
  due_date?: string | null;
  parent_id: string | null;
  position: number | null;
  subtasks: Task[];
  created_at: string;
  updated_at: string | null;
}

export interface TaskCreateInput {
  title: string;
  description?: string | null;
  priority?: Priority;
  tags?: string[];
  due_date?: string | null;
  parent_id?: string | null;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: Priority;
  tags?: string[];
  due_date?: string | null;
  parent_id?: string | null;
  position?: number;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  filtered: number;
}

export interface Tag {
  id: string;
  name: string;
  task_count: number;
}

// Todo is an alias for Task (used interchangeably in UI)
export type Todo = Task;

export type { TaskFilters, SortField, SortOrder };
