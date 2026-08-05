/**
 * TaskList - List container for tasks
 * Spec: 001-todo-web-crud, 002-todo-organization-features
 * Task: T088, T089, T091
 */

"use client";

import React from "react";
import type { Task } from "@/types/task";
import { TaskItem } from "./TaskItem";
import { EmptyState } from "./EmptyState";
import { EmptyFilterState } from "./EmptyFilterState";

interface TaskListProps {
  tasks: Task[];
  total: number;
  filtered: number;
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onToggle: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export function TaskList({
  tasks,
  total,
  filtered,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  onToggle,
  onEdit,
  onDelete
}: TaskListProps) {
  if (isLoading && tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  // Show empty filter state when there are filters applied but no results
  if (tasks.length === 0 && hasActiveFilters) {
    return (
      <EmptyFilterState
        message="No tasks match your filters"
        onClearFilters={onClearFilters}
      />
    );
  }

  // Show empty state when there are no filters and no results
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {/* Show task count */}
      <div className="text-sm text-muted-foreground">
        Showing {tasks.length} of {filtered} tasks ({total} total)
      </div>

      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
