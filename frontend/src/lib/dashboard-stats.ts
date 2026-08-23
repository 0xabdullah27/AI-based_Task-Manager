import type { Todo } from "@/types/task";

export interface DashboardStatistics {
  total: number;
  completed: number;
  pending: number;
  today: number;
}

export function calculateDashboardStats(
  todos: Todo[]
): DashboardStatistics {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    pending: todos.filter((t) => !t.completed).length,
    today: todos.filter((t) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      if (isNaN(dueDate.getTime())) return false;
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    }).length,
  };
}
