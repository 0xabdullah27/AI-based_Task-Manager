"use client";

import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { TagsList } from "../components/TagsList";
import { TodoCard } from "../components/TodoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";
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

export default function TagsPage() {
  const { tasks, isLoading, updateTask, deleteTask, toggleTask } = useTasks();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
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

  // Filter todos by selected tag
  const filteredTodos = useMemo(() => {
    if (!selectedTag || !tasks) return [];
    return tasks.filter((t) => t.tags && t.tags.includes(selectedTag));
  }, [tasks, selectedTag]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Tasks by Tags
          </h1>
        </div>
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Tasks by Tags
        </h1>
        <p className="text-muted-foreground mt-2">
          Filter and organize tasks by custom tags
        </p>
      </div>

      {/* Tags Grid */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          All Tags
        </h2>
        <TagsList
          todos={tasks}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
        />
      </div>

      {/* Filtered Tasks */}
      {selectedTag && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Tasks tagged: <span className="text-primary">#{selectedTag}</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredTodos.length} task{filteredTodos.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="space-y-3">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-8 bg-muted rounded-lg">
                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No tasks with this tag
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onToggle={() => toggleTask(todo.id)}
                  onEdit={openEditDialog}
                  onDelete={() => deleteTask(todo.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

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
