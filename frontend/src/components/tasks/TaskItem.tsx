/**
 * TaskItem - Individual task display with actions
 * Spec: 001-todo-web-crud, 002-todo-organization-features
 * Task: T086, T087, T110, T130, T038
 */

"use client";

import React, { useState } from "react";
import type { Task } from "@/types/task";
import { Button } from "@/components/ui/Button";
import { PriorityBadge } from "./PriorityBadge";
import { TagChip } from "./TagChip";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(task.id);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`p-4 border border-border rounded-lg hover:bg-muted transition-colors ${
        task.completed ? "bg-muted" : "bg-card"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox for completion toggle */}
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            disabled={isToggling}
            className="h-5 w-5 rounded border-input accent-primary focus:ring-primary disabled:opacity-50 cursor-pointer"
          />
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`text-base font-medium ${
                task.completed
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </h4>
            <PriorityBadge priority={task.priority} size="sm" />
          </div>
          {task.description && (
            <p
              className={`mt-1 text-sm ${
                task.completed ? "text-muted-foreground" : "text-muted-foreground"
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Display tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.map((tag, index) => (
                <TagChip key={`${task.id}-tag-${index}`} name={tag} />
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            {task.due_date && (
              <span className="mr-2 font-medium text-foreground">
                Due: {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} •
              </span>
            )}
            Created: {new Date(task.created_at).toLocaleDateString()}
            {task.updated_at && (
              <span className="ml-2">
                • Updated: {new Date(task.updated_at).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(task.id)}
            disabled={isDeleting}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
