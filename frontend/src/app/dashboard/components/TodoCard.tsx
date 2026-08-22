"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, Circle, MoreVertical, Trash2, Edit, Calendar } from "lucide-react";
import { getPriorityConfig } from "@/lib/priority-colors";
import type { Todo } from "@/types/task";

interface TodoCardProps {
  todo: Todo;
  onToggle: () => void;
  onEdit: (todo: Todo) => void;
  onDelete: () => void;
}

export function TodoCard({ todo, onToggle, onEdit, onDelete }: TodoCardProps) {
  const priorityConfig = getPriorityConfig(todo.priority);

  return (
    // T030: Update todo card background and border to use theme variables
    <Card
      className="transition"
      style={{
        borderColor: "var(--border)",
        backgroundColor: todo.completed ? "var(--muted)" : "var(--card)",
      }}
    >
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {/* Checkbox */}
          <button onClick={onToggle} className="mt-1 flex-shrink-0">
            {todo.completed ? (
              <CheckCircle2 className="w-6 h-6 text-success" />
            ) : (
              <Circle
                className="w-6 h-6 transition hover:opacity-70"
                style={{ color: "var(--border)" }}
              />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {/* T029: Use --foreground for todo title */}
                <h3
                  className={`font-semibold transition ${
                    todo.completed ? "line-through opacity-60" : ""
                  }`}
                  style={{ color: "var(--foreground)" }}
                >
                  {todo.title}
                </h3>
                {todo.description && (
                  // T029: Use semantic color for description
                  <p
                    className={`text-sm mt-1 ${
                      todo.completed ? "line-through opacity-60" : ""
                    }`}
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {todo.description}
                  </p>
                )}
              </div>

              {/* Action Menu - T031: Ensure menu icon and button are visible */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    style={{ color: "var(--foreground)" }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                {/* T032: Update menu dropdown styling for readability */}
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(todo)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    style={{ color: "var(--destructive)" }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {/* T028: Use CSS variables for priority badge styling */}
              <Badge
                className="border-0"
                style={{
                  backgroundColor: priorityConfig.bgVar,
                  color: priorityConfig.textVar,
                }}
              >
                {priorityConfig.label}
              </Badge>
              {todo.due_date && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 transition"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  <Calendar className="w-3 h-3" />
                  {new Date(todo.due_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Badge>
              )}
              {/* T034: Update tag styling while maintaining priority-based coloring */}
              {todo.tags && todo.tags.length > 0 && (
                <>
                  {todo.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="transition"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
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
}
