"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { PriorityTabs } from "../components/PriorityTabs";
import { TodoCard } from "../components/TodoCard";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { TaskForm } from "@/components/tasks/TaskForm";
import { toast } from "sonner";
import type { Todo } from "@/types/task";
import type { TaskCreateInput } from "@/lib/validations/task";

export default function PriorityPage() {
  const { tasks, isLoading, updateTask, deleteTask, toggleTask } = useTasks();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setFormDialogOpen(true);
  };

  const closeFormDialog = () => {
    setFormDialogOpen(false);
    setEditingTodo(null);
  };

  const handleEditSubmit = async (data: TaskCreateInput) => {
    if (!editingTodo) return;
    try {
      await updateTask(editingTodo.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_date: data.due_date,
        tags: data.tags,
      });
      toast.success("Task updated");
      closeFormDialog();
    } catch {
      toast.error("Failed to update task");
    }
  };

  // T006: Fixed priority filtering logic to render all priority levels
  const renderPriorityContent = (
    todos: Todo[],
    priority: "high" | "medium" | "low"
  ) => {
    if (todos.length === 0) {
      return (
        <div className="text-center py-8 bg-muted rounded-lg">
          <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No tasks at this priority level
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {todos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onToggle={() => toggleTask(todo.id)}
            onEdit={openEditDialog}
            onDelete={() => deleteTask(todo.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Tasks by Priority
        </h1>
        <p className="text-muted-foreground mt-2">
          Organize and view tasks by priority level
        </p>
      </div>

      {/* Priority Tabs */}
      <PriorityTabs
        todos={tasks}
        isLoading={isLoading}
        renderContent={renderPriorityContent}
      />

      {/* Edit Task Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTodo && (
            <TaskForm
              todo={editingTodo}
              onSubmit={handleEditSubmit}
              onCancel={closeFormDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
