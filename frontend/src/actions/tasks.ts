"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { Task } from "@/types/task";
import type { TaskCreateInput, TaskUpdateInput } from "@/lib/validations/task";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  filtered: number;
}

/**
 * Helper to retrieve server-side JWT / session token for FastAPI requests.
 */
async function getServerAuthHeaders(): Promise<HeadersInit> {
  try {
    const reqHeaders = await headers();
    const tokenData = await auth.api.getToken({ headers: reqHeaders }).catch(() => null);

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (tokenData?.token) {
      requestHeaders["Authorization"] = `Bearer ${tokenData.token}`;
    }

    const cookie = reqHeaders.get("cookie");
    if (cookie) {
      requestHeaders["Cookie"] = cookie;
    }

    return requestHeaders;
  } catch (error) {
    console.error("Error retrieving server auth headers:", error);
    return {
      "Content-Type": "application/json",
    };
  }
}

/**
 * Fetch initial tasks server-side for Server Components (RSC).
 */
export async function getInitialTasks(): Promise<TaskListResponse> {
  try {
    const headers = await getServerAuthHeaders();
    const response = await fetch(`${BACKEND_URL}/api/todos/`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return { tasks: [], total: 0, filtered: 0 };
    }

    const data = await response.json();
    return {
      tasks: data.tasks || [],
      total: data.total || 0,
      filtered: data.filtered || 0,
    };
  } catch (error) {
    console.error("Failed to fetch initial tasks on server:", error);
    return { tasks: [], total: 0, filtered: 0 };
  }
}

/**
 * Server Action: Create a new task.
 */
export async function createTaskAction(data: TaskCreateInput): Promise<Task> {
  const headers = await getServerAuthHeaders();
  const response = await fetch(`${BACKEND_URL}/api/todos/`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to create task (${response.status}): ${errorText}`);
  }

  const createdTask: Task = await response.json();
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/todos");
  return createdTask;
}

/**
 * Server Action: Update an existing task.
 */
export async function updateTaskAction(
  id: string,
  data: TaskUpdateInput
): Promise<Task> {
  const headers = await getServerAuthHeaders();
  const response = await fetch(`${BACKEND_URL}/api/todos/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to update task (${response.status}): ${errorText}`);
  }

  const updatedTask: Task = await response.json();
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/todos");
  return updatedTask;
}

/**
 * Server Action: Delete a task.
 */
export async function deleteTaskAction(id: string): Promise<void> {
  const headers = await getServerAuthHeaders();
  const response = await fetch(`${BACKEND_URL}/api/todos/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to delete task (${response.status}): ${errorText}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/todos");
}

/**
 * Server Action: Toggle task completion.
 */
export async function toggleTaskAction(id: string): Promise<Task> {
  const headers = await getServerAuthHeaders();
  const response = await fetch(`${BACKEND_URL}/api/todos/${id}/toggle`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to toggle task (${response.status}): ${errorText}`);
  }

  const toggledTask: Task = await response.json();
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/todos");
  return toggledTask;
}
