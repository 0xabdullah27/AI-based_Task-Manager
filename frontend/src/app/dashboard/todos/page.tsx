"use client";

import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { getPriorityConfig } from "@/lib/priority-colors";
import type { TaskCreateInput } from "@/lib/validations/task";
import type { Todo } from "@/types/task";

type FilterStatus = "all" | "active" | "completed";

export default function TodosPage() {
  const {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
  } = useTasks();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Filter and search todos
  const filteredTodos = useMemo(() => {
    let filtered = tasks || [];

    // Apply status filter
    if (filterStatus === "active") {
      filtered = filtered.filter((t) => !t.completed);
    } else if (filterStatus === "completed") {
      filtered = filtered.filter((t) => t.completed);
    }

    // Apply search filter (debounced in component)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [tasks, filterStatus, searchQuery]);

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
      toast.success("Task updated");
    } catch (error) {
      toast.error("Failed to update task");
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

  const totalCount = tasks?.length || 0;
  const filteredCount = filteredTodos.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            All Tasks
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and organize all your tasks
          </p>
        </div>
        <Button
          onClick={() => setFormDialogOpen(true)}
          className="bg-primary cursor-pointer text-primary-foreground w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "active", "completed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as FilterStatus)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                filterStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary   text-secondary-foreground hover:opacity-80"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Task Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} tasks
          {filterStatus !== "all" && ` (${filterStatus})`}
        </p>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading Skeleton
          <>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </>
        ) : filteredCount === 0 ? (
          // Empty State
          <div className="text-center py-12 bg-muted rounded-lg">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery
                ? "No tasks found"
                : filterStatus === "completed"
                  ? "No completed tasks"
                  : filterStatus === "active"
                    ? "No active tasks"
                    : "No tasks yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try adjusting your search"
                : "Create a new task to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setFormDialogOpen(true)}
                className="bg-primary hover:bg-primary/80 text-primary-foreground cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        ) : (
          // Task Cards
          filteredTodos.map((todo) => {
            const priorityConfig = getPriorityConfig(todo.priority);
            return (
              <Card
                key={todo.id}
                className={`border-border transition ${
                  todo.completed
                    ? "bg-muted"
                    : "hover:shadow-md"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3
                            className={`font-semibold text-foreground transition ${
                              todo.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p
                              className={`text-sm text-muted-foreground mt-1 ${
                                todo.completed ? "line-through" : ""
                              }`}
                            >
                              {todo.description}
                            </p>
                          )}
                        </div>

                        {/* Action Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-shrink-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(todo)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteConfirm(todo.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {/* Priority Badge */}
                        <Badge
                          className="border-0"
                          style={{
                            backgroundColor: priorityConfig.bgVar,
                            color: priorityConfig.textVar,
                          }}
                        >
                          {priorityConfig.label}
                        </Badge>

                        {/* Tag Badges */}
                        {todo.tags && todo.tags.length > 0 && (
                          <>
                            {todo.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="border-border"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
  
      {/* Create/Edit Dialog */}
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
              Are you sure you want to delete this task? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTodo}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
