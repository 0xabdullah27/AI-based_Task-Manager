"use client";

import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatCard } from "./StatCard";
import { FilterBar, type FilterState } from "./FilterBar";
import { TaskGroupSection } from "./TaskGroupSection";
import { TodoCard } from "./TodoCard";
import { groupTasksByUrgency, startOfDay } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskForm } from "@/components/tasks/TaskForm";
import { BarChart3, CheckCircle2, Zap, Plus, AlertTriangle, ListFilter, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { TaskCreateInput } from "@/lib/validations/task";
import type { Todo } from "@/types/task";

const INITIAL_FILTERS: FilterState = {
  search: "",
  status: "active",
  quickPreset: null,
  priority: "all",
  selectedTags: [],
};

export function TaskCommandCenter() {
  const {
    tasks,
    isLoading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
  } = useTasks();

  const stats = useDashboardStats(tasks);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);

  // Extract unique tags
  const availableTags = useMemo(() => {
    if (!tasks) return [];
    const tagSet = new Set<string>();
    tasks.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Calculate Overdue count for top stats card
  const overdueCount = useMemo(() => {
    if (!tasks) return 0;
    const today = startOfDay(new Date());
    return tasks.filter((t) => {
      if (t.completed || !t.due_date) return false;
      const d = startOfDay(new Date(t.due_date));
      return d < today;
    }).length;
  }, [tasks]);

  const completionPercentage = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  // Filter tasks based on search, status, quickPreset, priority, and tags
  const filteredTasks = useMemo(() => {
    let result = tasks || [];

    // Status filter
    if (filters.status === "active") {
      result = result.filter((t) => !t.completed);
    } else if (filters.status === "completed") {
      result = result.filter((t) => t.completed);
    }

    // Priority filter
    if (filters.priority !== "all") {
      result = result.filter((t) => t.priority === filters.priority);
    }

    // Quick presets
    if (filters.quickPreset) {
      const today = startOfDay(new Date());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (filters.quickPreset === "overdue") {
        result = result.filter((t) => {
          if (t.completed || !t.due_date) return false;
          return startOfDay(new Date(t.due_date)) < today;
        });
      } else if (filters.quickPreset === "today") {
        result = result.filter((t) => {
          if (!t.due_date) return false;
          return startOfDay(new Date(t.due_date)).getTime() === today.getTime();
        });
      } else if (filters.quickPreset === "tomorrow") {
        result = result.filter((t) => {
          if (!t.due_date) return false;
          return startOfDay(new Date(t.due_date)).getTime() === tomorrow.getTime();
        });
      } else if (filters.quickPreset === "high_priority") {
        result = result.filter((t) => t.priority === "high");
      }
    }

    // Selected Tags filter (MUST contain all selected tags)
    if (filters.selectedTags.length > 0) {
      result = result.filter((t) =>
        filters.selectedTags.every((st) => t.tags?.includes(st))
      );
    }

    // Search query (Title, Description, Tags)
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      const cleanQuery = query.startsWith("#") ? query.slice(1) : query;

      result = result.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(query);
        const descMatch = t.description?.toLowerCase().includes(query);
        const tagMatch = t.tags?.some((tag) => tag.toLowerCase().includes(cleanQuery));
        return titleMatch || descMatch || tagMatch;
      });
    }

    return result;
  }, [tasks, filters]);

  // Group filtered tasks chronologically
  const taskGroups = useMemo(() => {
    return groupTasksByUrgency(filteredTasks);
  }, [filteredTasks]);

  // Handlers
  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleCreateTodo = async (data: TaskCreateInput) => {
    try {
      await createTask(data);
      setFormDialogOpen(false);
      setEditingTodo(null);
      toast.success("Task created successfully");
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleEditTodo = async (data: TaskCreateInput) => {
    if (!editingTodo) return;
    try {
      await updateTask(editingTodo.id, data);
      setFormDialogOpen(false);
      setEditingTodo(null);
      toast.success("Task updated successfully");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTodo = async () => {
    if (!deletingTodoId) return;
    try {
      await deleteTask(deletingTodoId);
      setDeleteConfirmOpen(false);
      setDeletingTodoId(null);
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleToggleTodo = async (todoId: string) => {
    try {
      await toggleTask(todoId);
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const handleAddSubtask = async (parentId: string, title: string) => {
    try {
      await createTask({ title, parent_id: parentId, priority: "low", tags: [] });
      toast.success("Subtask added");
    } catch (error) {
      toast.error("Failed to add subtask");
    }
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setFormDialogOpen(true);
  };

  const openDeleteConfirm = (todoId: string) => {
    setDeletingTodoId(todoId);
    setDeleteConfirmOpen(true);
  };

  const closeFormDialog = () => {
    setFormDialogOpen(false);
    setEditingTodo(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Task Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage priorities, track deadlines, and organize your work seamlessly.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => fetchTasks()}
            disabled={isLoading}
            className="cursor-pointer border-border/80 text-foreground hover:bg-muted font-medium flex items-center gap-2 h-10"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Reload</span>
          </Button>
          <Button
            onClick={() => {
              setEditingTodo(null);
              setFormDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer font-semibold h-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* 4 Cards with Individual Borders & Gap */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {isLoading && (!tasks || tasks.length === 0) ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Total Tasks"
              value={stats.total}
              icon={BarChart3}
              variant="total"
              onClick={() => handleFilterChange({ status: "all", quickPreset: null })}
              isActive={filters.status === "all" && !filters.quickPreset}
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              variant="completed"
              progress={completionPercentage}
              onClick={() => handleFilterChange({ status: "completed", quickPreset: null })}
              isActive={filters.status === "completed"}
            />
            <StatCard
              label="Due Today"
              value={stats.today}
              icon={Zap}
              variant="today"
              onClick={() => handleFilterChange({ quickPreset: "today" })}
              isActive={filters.quickPreset === "today"}
            />
            <StatCard
              label="Overdue"
              value={overdueCount}
              icon={AlertTriangle}
              variant="overdue"
              onClick={() => handleFilterChange({ quickPreset: "overdue" })}
              isActive={filters.quickPreset === "overdue"}
            />
          </>
        )}
      </div>

      {/* Interactive Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        availableTags={availableTags}
        totalCount={tasks?.length || 0}
        filteredCount={filteredTasks.length}
      />

      {/* Main Task List with Smart Grouping */}
      <div className="space-y-5">
        {isLoading && (!tasks || tasks.length === 0) ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          // Empty State
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-card/40">
            <ListFilter className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-1">
              No tasks found
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              {filters.search || filters.quickPreset || filters.selectedTags.length > 0
                ? "No tasks match your current filter criteria. Try adjusting or clearing your filters."
                : filters.status === "completed"
                ? "You haven't completed any tasks yet."
                : "Your task list is clean! Create your first task to get started."}
            </p>

            {filters.search || filters.quickPreset || filters.selectedTags.length > 0 ? (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="cursor-pointer font-medium"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                onClick={() => setFormDialogOpen(true)}
                className="bg-primary text-primary-foreground cursor-pointer font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        ) : (
          // Render Groups
          taskGroups.map((group) => (
            <TaskGroupSection
              key={group.id}
              group={group}
              defaultExpanded={group.id !== "completed" || filters.status === "completed"}
              renderTask={(task) => (
                <TodoCard
                  key={task.id}
                  todo={task}
                  onToggle={() => handleToggleTodo(task.id)}
                  onEdit={openEditDialog}
                  onDelete={() => openDeleteConfirm(task.id)}
                  onAddSubtask={handleAddSubtask}
                  onToggleSubtask={handleToggleTodo}
                />
              )}
            />
          ))
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={closeFormDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTodo ? "Edit Task" : "Create New Task"}
            </DialogTitle>
          </DialogHeader>
          <TaskForm
            onSubmit={editingTodo ? handleEditTodo : handleCreateTodo}
            onCancel={closeFormDialog}
            isLoading={isLoading}
            defaultValues={
              editingTodo
                ? {
                    title: editingTodo.title,
                    description: editingTodo.description || undefined,
                    priority: editingTodo.priority,
                    tags: editingTodo.tags,
                    due_date: editingTodo.due_date || undefined,
                  }
                : undefined
            }
            mode={editingTodo ? "edit" : "create"}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTodo}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer font-semibold"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
