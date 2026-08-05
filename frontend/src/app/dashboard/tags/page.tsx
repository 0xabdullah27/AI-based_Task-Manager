"use client";

import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { TagsList } from "../components/TagsList";
import { TodoCard } from "../components/TodoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";
import type { Todo } from "@/types/task";

export default function TagsPage() {
  const { tasks, isLoading, updateTask, deleteTask, toggleTask } = useTasks();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
                  onEdit={(t) => {
                    // Handle edit
                  }}
                  onDelete={() => deleteTask(todo.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
