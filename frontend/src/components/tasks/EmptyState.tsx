/**
 * EmptyState - Displayed when task list is empty
 * Spec: 001-todo-web-crud
 * Task: T080
 */

"use client";

import React from "react";

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-foreground">No tasks</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by creating a new task.
      </p>
    </div>
  );
}
