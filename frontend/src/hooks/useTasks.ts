/**
 * useTasks - Task management hook backed by the shared TasksProvider.
 * Spec: 001-todo-web-crud
 * Task: T081
 *
 * Consumers read from the single in-memory tasks store mounted in the
 * dashboard layout, so data survives route navigation without refetching.
 * Migration to Redux Toolkit: replace the provider internals with a slice,
 * keep this hook's API unchanged.
 */

"use client";

import { useTasksContext } from "@/providers/tasks-provider";

export type { FetchTasksParams as TaskFetchParams } from "@/providers/tasks-provider";

export function useTasks() {
  return useTasksContext();
}
