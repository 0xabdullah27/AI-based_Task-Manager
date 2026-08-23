import type { Todo } from "@/types/task";

export type GroupCategory = "overdue" | "today" | "upcoming" | "later" | "completed";

export interface TaskGroup {
  id: GroupCategory;
  title: string;
  icon: string;
  description: string;
  badgeClass: string;
  borderClass: string;
  headerBgClass: string;
  tasks: Todo[];
}

/**
 * Normalizes a date to start of day (midnight) in local time
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formats a due date into a human-friendly relative string
 * e.g. "Overdue by 2 days", "Due Today", "Due Tomorrow", "In 4 days"
 */
export function getRelativeDueDateText(dueDateStr?: string | null): { text: string; isOverdue: boolean; isToday: boolean } {
  if (!dueDateStr) return { text: "", isOverdue: false, isToday: false };

  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime())) return { text: "", isOverdue: false, isToday: false };

  const today = startOfDay(new Date());
  const target = startOfDay(dueDate);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      text: days === 1 ? "Overdue by 1 day" : `Overdue by ${days} days`,
      isOverdue: true,
      isToday: false,
    };
  }

  if (diffDays === 0) {
    return { text: "Due Today", isOverdue: false, isToday: true };
  }

  if (diffDays === 1) {
    return { text: "Due Tomorrow", isOverdue: false, isToday: false };
  }

  if (diffDays > 1 && diffDays <= 7) {
    return { text: `In ${diffDays} days`, isOverdue: false, isToday: false };
  }

  // Formatting for further dates
  const formatted = dueDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: dueDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });

  return { text: `Due ${formatted}`, isOverdue: false, isToday: false };
}

/**
 * Categorizes a list of tasks into smart visual groups:
 * 1. ⚠️ Overdue (Due before today)
 * 2. 📅 Due Today (Due today)
 * 3. 🔥 This Week (Due in next 7 days)
 * 4. 📌 Later (Remaining pending tasks or no due date)
 * 5. ✅ Completed (Completed tasks)
 */
export function groupTasksByUrgency(tasks: Todo[]): TaskGroup[] {
  const today = startOfDay(new Date());
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  const overdue: Todo[] = [];
  const dueToday: Todo[] = [];
  const thisWeek: Todo[] = [];
  const later: Todo[] = [];
  const completed: Todo[] = [];

  tasks.forEach((task) => {
    if (task.completed) {
      completed.push(task);
      return;
    }

    if (!task.due_date) {
      later.push(task);
      return;
    }

    const dueDate = new Date(task.due_date);
    if (isNaN(dueDate.getTime())) {
      later.push(task);
      return;
    }

    const taskDay = startOfDay(dueDate);

    if (taskDay < today) {
      overdue.push(task);
    } else if (taskDay.getTime() === today.getTime()) {
      dueToday.push(task);
    } else if (taskDay <= next7Days) {
      thisWeek.push(task);
    } else {
      later.push(task);
    }
  });

  // Helper to sort tasks: 1. Priority (High > Medium > Low), 2. Due Date (Soonest first)
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortByPriority = (a: Todo, b: Todo) => {
    const pA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
    const pB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
    if (pA !== pB) {
      return pB - pA;
    }
    
    // Sort by Due Date (if priorities are equal)
    const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return dateA - dateB;
  };

  return [
    {
      id: "overdue",
      title: "Overdue",
      icon: "AlertCircle",
      description: "Tasks requiring immediate attention",
      badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
      borderClass: "border-destructive/40",
      headerBgClass: "bg-destructive/10",
      tasks: overdue.sort(sortByPriority),
    },
    {
      id: "today",
      title: "Due Today",
      icon: "Target",
      description: "Tasks scheduled for completion today",
      badgeClass: "bg-warning/15 text-warning border-warning/30",
      borderClass: "border-warning/40",
      headerBgClass: "bg-warning/10",
      tasks: dueToday.sort(sortByPriority),
    },
    {
      id: "upcoming",
      title: "This Week",
      icon: "Calendar",
      description: "Tasks due within the next 7 days",
      badgeClass: "bg-info/15 text-info border-info/30",
      borderClass: "border-info/40",
      headerBgClass: "bg-info/10",
      tasks: thisWeek.sort(sortByPriority),
    },
    {
      id: "later",
      title: "Later",
      icon: "Inbox",
      description: "Tasks due further out, or with no specific deadline",
      badgeClass: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
      borderClass: "border-border",
      headerBgClass: "bg-muted/40",
      tasks: later.sort(sortByPriority),
    },
    {
      id: "completed",
      title: "Completed",
      icon: "CheckCircle2",
      description: "Finished tasks",
      badgeClass: "bg-success/15 text-success border-success/30",
      borderClass: "border-success/30",
      headerBgClass: "bg-success/10",
      tasks: completed.sort(sortByPriority), // Maybe sort by completion date instead, but this is fine
    },
  ];
}
