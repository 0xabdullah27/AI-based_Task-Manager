"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Task } from "@/types/task";
import type { TaskCreateInput, TaskUpdateInput } from "@/lib/validations/task";
import api from "@/middleware/api-interceptor";
import { useSession } from "@/lib/auth-client";

export interface FetchTasksParams {
  search?: string;
  status?: "all" | "pending" | "completed";
  priority?: "all" | "high" | "medium" | "low";
  tags?: string[];
  noTags?: boolean;
  sort?: "priority" | "title" | "created_at";
  order?: "asc" | "desc";
}

export interface FetchTasksOptions {
  silent?: boolean;
}

interface TaskListResponse {
  tasks: Task[];
  total: number;
  filtered: number;
}

interface TasksContextValue {
  tasks: Task[];
  total: number;
  filtered: number;
  isLoading: boolean;
  error: Error | null;
  fetchTasks: (params?: FetchTasksParams, options?: FetchTasksOptions) => Promise<void>;
  createTask: (data: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, data: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<Task>;
}

const TasksContext = createContext<TasksContextValue | null>(null);

/**
 * TasksProvider - Single source of truth for tasks state.
 * Mounted in the root layout so it survives all route navigation
 * (home <-> dashboard) for the lifetime of the SPA session.
 * Holds all tasks in memory; CRUD operations update local state and
 * the backend together, so the UI never refetches on tab switches.
 * Fetches only for an authenticated user and clears state on logout.
 * Designed as a Redux-like slice: swap the internals for Redux Toolkit
 * later without changing the useTasks() consumer API.
 */
export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [filtered, setFiltered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadedForRef = useRef<string | null>(null);
  const lastParamsRef = useRef<FetchTasksParams | undefined>(undefined);
  const tasksRef = useRef<Task[]>([]);
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const fetchTasks = useCallback(async (params?: FetchTasksParams, options?: FetchTasksOptions) => {
    try {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setError(null);
      lastParamsRef.current = params;

      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.status && params.status !== "all") queryParams.append("status", params.status);
      if (params?.priority && params.priority !== "all") queryParams.append("priority", params.priority);
      if (params?.tags && params.tags.length > 0) {
        params.tags.forEach((tag) => queryParams.append("tags", tag));
      }
      if (params?.noTags) queryParams.append("no_tags", "true");
      if (params?.sort) queryParams.append("sort", params.sort);
      if (params?.order) queryParams.append("order", params.order);

      const queryString = queryParams.toString();
      const url = `/api/todos${queryString ? "?" + queryString : ""}`;

      const response = await api.get<TaskListResponse>(url);
      setTasks(response.data.tasks);
      setTotal(response.data.total);
      setFiltered(response.data.filtered);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch tasks"));
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      loadedForRef.current = null;
      setTasks([]);
      setTotal(0);
      setFiltered(0);
      setError(null);
      return;
    }
    if (loadedForRef.current === userId) return;
    loadedForRef.current = userId;
    fetchTasks();
  }, [userId, fetchTasks]);

  const createTask = useCallback(async (data: TaskCreateInput): Promise<Task> => {
    try {
      setError(null);
      const response = await api.post<Task>("/api/todos", data);
      if (response.data.parent_id) {
        await fetchTasks(lastParamsRef.current, { silent: true });
      } else {
        setTasks((prev) => [response.data, ...prev]);
        setTotal((prev) => prev + 1);
        setFiltered((prev) => prev + 1);
      }
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create task");
      setError(error);
      throw error;
    }
  }, [fetchTasks]);

  const updateTask = useCallback(async (id: string, data: TaskUpdateInput): Promise<Task> => {
    try {
      setError(null);
      const response = await api.patch<Task>(`/api/todos/${id}`, data);
      if (response.data.parent_id || (response.data.subtasks && response.data.subtasks.length > 0) || data.parent_id || data.position !== undefined) {
        await fetchTasks(lastParamsRef.current, { silent: true });
      } else {
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? response.data : task))
        );
      }
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update task");
      setError(error);
      throw error;
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const previousTasks = tasksRef.current;
    const target = previousTasks.find((task) => task.id === id);

    // Optimistically remove from state
    setTasks((prev) =>
      prev
        .filter((task) => task.id !== id)
        .map((task) => ({
          ...task,
          subtasks: task.subtasks?.filter((s) => s.id !== id) || [],
        }))
    );

    try {
      setError(null);
      await api.delete(`/api/todos/${id}`);
      if ((target?.subtasks?.length ?? 0) > 0 || target?.parent_id) {
        await fetchTasks(lastParamsRef.current, { silent: true });
      } else {
        setTotal((prev) => Math.max(0, prev - 1));
        setFiltered((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      setTasks(previousTasks);
      const error = err instanceof Error ? err : new Error("Failed to delete task");
      setError(error);
      throw error;
    }
  }, [fetchTasks]);

  const toggleTask = useCallback(async (id: string): Promise<Task> => {
    const previousTasks = tasksRef.current;

    // Optimistically toggle status in local state for instant UI response
    setTasks((prev) =>
      prev.map((task) => {
        // Check if root task
        if (task.id === id) {
          const nextCompleted = !task.completed;
          return {
            ...task,
            completed: nextCompleted,
            subtasks: task.subtasks?.map((s) => ({ ...s, completed: nextCompleted })) ?? [],
          };
        }
        // Check if subtask inside this parent
        if (task.subtasks && task.subtasks.some((s) => s.id === id)) {
          const updatedSubtasks = task.subtasks.map((s) =>
            s.id === id ? { ...s, completed: !s.completed } : s
          );
          const allCompleted =
            updatedSubtasks.length > 0 &&
            updatedSubtasks.every((s) => s.completed);
          return {
            ...task,
            completed: allCompleted,
            subtasks: updatedSubtasks,
          };
        }
        return task;
      })
    );

    try {
      setError(null);
      const response = await api.post<Task>(`/api/todos/${id}/toggle`);
      if (response.data.parent_id || (response.data.subtasks && response.data.subtasks.length > 0)) {
        await fetchTasks(lastParamsRef.current, { silent: true });
      } else {
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? response.data : task))
        );
      }
      return response.data;
    } catch (err) {
      // Rollback to previous state on failure
      setTasks(previousTasks);
      const error = err instanceof Error ? err : new Error("Failed to toggle task");
      setError(error);
      throw error;
    }
  }, [fetchTasks]);

  const value = {
    tasks,
    total,
    filtered,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasksContext(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasksContext must be used within a TasksProvider");
  }
  return context;
}
