"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Edit,
  Calendar,
  AlertTriangle,
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { getPriorityConfig } from "@/lib/priority-colors";
import { getRelativeDueDateText } from "@/lib/date-utils";
import type { Todo } from "@/types/task";

interface TodoCardProps {
  todo: Todo;
  onToggle: () => void;
  onEdit: (todo: Todo) => void;
  onDelete: () => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onToggleSubtask?: (subtaskId: string) => void;
}

export function TodoCard({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
}: TodoCardProps) {
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);

  const priorityConfig = getPriorityConfig(todo.priority);
  const dueInfo = getRelativeDueDateText(todo.due_date);

  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
  const completedSubtasksCount = hasSubtasks
    ? todo.subtasks.filter((s) => s.completed).length
    : 0;
  const totalSubtasksCount = hasSubtasks ? todo.subtasks.length : 0;
  const subtasksPending = hasSubtasks && completedSubtasksCount < totalSubtasksCount;

  const subtaskProgressPercentage = totalSubtasksCount > 0
    ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100)
    : 0;

  // Left urgency accent border line determination
  const accentBorderClass = todo.completed
    ? "border-l-4 border-l-emerald-500/50"
    : dueInfo.isOverdue
    ? "border-l-4 border-l-destructive"
    : dueInfo.isToday
    ? "border-l-4 border-l-amber-500"
    : todo.priority === "high"
    ? "border-l-4 border-l-blue-500"
    : "border-l-4 border-l-border/80";

  const handleAddSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = subtaskTitle.trim();
    if (!trimmed || !onAddSubtask || isSubmittingSubtask) return;

    setIsSubmittingSubtask(true);
    try {
      await onAddSubtask(todo.id, trimmed);
      setSubtaskTitle("");
      setIsAddingSubtask(false);
    } finally {
      setIsSubmittingSubtask(false);
    }
  };

  return (
    <Card
      className={`transition-all duration-200 ${accentBorderClass} overflow-hidden ${
        todo.completed
          ? "bg-muted/30 opacity-75 border-border/50"
          : dueInfo.isOverdue
          ? "bg-destructive/5 border-destructive/30 hover:border-destructive/60 hover:shadow-md"
          : "bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          {/* Main Checkbox */}
          <button
            onClick={onToggle}
            title={todo.completed ? "Mark incomplete" : "Mark complete"}
            className="mt-0.5 flex-shrink-0 cursor-pointer transition-transform hover:scale-110"
          >
            {todo.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            )}
          </button>

          {/* Main Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3
                  className={`font-bold text-base text-foreground leading-snug transition ${
                    todo.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {todo.title}
                </h3>
                {todo.description && (
                  <p
                    className={`text-sm text-muted-foreground mt-1 line-clamp-2 ${
                      todo.completed ? "line-through opacity-70" : ""
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
                    className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted"
                  >
                    <MoreVertical className="w-4 h-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => onEdit(todo)}
                    className="cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                  {onAddSubtask && !todo.parent_id && (
                    <DropdownMenuItem
                      onClick={() => setIsAddingSubtask(true)}
                      className="cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Priority Badge */}
              <Badge
                className="border-0 font-semibold px-2.5 py-0.5 text-xs capitalize shadow-2xs"
                style={{
                  backgroundColor: priorityConfig.bgVar,
                  color: priorityConfig.textVar,
                }}
              >
                {priorityConfig.label}
              </Badge>

              {/* Relative Due Date Badge */}
              {todo.due_date && dueInfo.text && (
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 text-xs px-2.5 py-0.5 border font-medium ${
                    dueInfo.isOverdue
                      ? "bg-destructive/15 text-destructive border-destructive/40 font-semibold"
                      : dueInfo.isToday
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 font-semibold"
                      : "border-border text-muted-foreground bg-muted/40"
                  }`}
                >
                  {dueInfo.isOverdue ? (
                    <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  {dueInfo.text}
                </Badge>
              )}

              {/* Tag Badges */}
              {todo.tags && todo.tags.length > 0 && (
                <>
                  {todo.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-border/60 bg-muted/30 text-muted-foreground text-xs px-2 py-0.5"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </>
              )}
            </div>

            {/* Subtasks Progress Bar & Checklist Section */}
            {hasSubtasks && (
              <div className="mt-3.5 pt-3 border-t border-border/50 space-y-2">
                {/* Progress bar header */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSubtasksExpanded((prev) => !prev)}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {subtasksExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span>Subtask Steps ({completedSubtasksCount}/{totalSubtasksCount})</span>
                  </button>

                  <span className="text-muted-foreground font-medium text-[11px]">
                    {subtaskProgressPercentage}% completed
                  </span>
                </div>

                {/* Progress bar visual indicator */}
                <Progress value={subtaskProgressPercentage} className="h-1.5 bg-muted/60" />

                {/* Subtask list */}
                {subtasksExpanded && (
                  <div className="space-y-1.5 pl-2 pt-1 border-l-2 border-primary/30 mt-2">
                    {todo.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 text-xs py-0.5 group"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleSubtask?.(subtask.id)}
                          className="cursor-pointer flex-shrink-0 text-muted-foreground hover:text-foreground transition"
                          aria-label={`Toggle subtask ${subtask.title}`}
                        >
                          {subtask.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground" />
                          )}
                        </button>
                        <span
                          className={`flex-1 ${
                            subtask.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inline Add Subtask Input Form */}
            {isAddingSubtask ? (
              <form
                onSubmit={handleAddSubtaskSubmit}
                className="mt-3 flex items-center gap-2"
              >
                <Input
                  type="text"
                  placeholder="Subtask title..."
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  disabled={isSubmittingSubtask}
                  className="h-8 text-xs bg-muted/50 border-border"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingSubtask || !subtaskTitle.trim()}
                  className="h-8 text-xs px-3 bg-primary text-primary-foreground cursor-pointer font-semibold"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingSubtask(false)}
                  disabled={isSubmittingSubtask}
                  className="h-8 text-xs px-2 cursor-pointer"
                >
                  Cancel
                </Button>
              </form>
            ) : (
              !todo.parent_id &&
              onAddSubtask && (
                <button
                  type="button"
                  onClick={() => setIsAddingSubtask(true)}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition cursor-pointer font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add subtask step
                </button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
