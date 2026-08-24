"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
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
  MoreHorizontal,
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
  onDeleteSubtask?: (subtaskId: string) => void;
}

export function TodoCard({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
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
  
  const subtaskProgressPercentage = totalSubtasksCount > 0
    ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100)
    : 0;

  const handleAddSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = subtaskTitle.trim();
    if (!trimmed || !onAddSubtask || isSubmittingSubtask) return;

    setIsSubmittingSubtask(true);
    try {
      await onAddSubtask(todo.id, trimmed);
      setSubtaskTitle("");
      setIsAddingSubtask(false);
      setSubtasksExpanded(true);
    } finally {
      setIsSubmittingSubtask(false);
    }
  };

  return (
    <div
      className={`group flex items-start gap-3 py-3 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors ${
        todo.completed ? "opacity-60" : ""
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        title={todo.completed ? "Mark incomplete" : "Mark complete"}
        className="mt-0.5 flex-shrink-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
      >
        {todo.completed ? (
          <CheckCircle2 className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <Circle className="w-[18px] h-[18px]" strokeWidth={1.5} />
        )}
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-medium text-foreground leading-snug truncate ${
                todo.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {todo.title}
            </h3>
            
            {todo.description && (
              <p
                className={`text-[13px] text-muted-foreground mt-0.5 line-clamp-1 ${
                  todo.completed ? "line-through" : ""
                }`}
              >
                {todo.description}
              </p>
            )}

            {/* Properties Row */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {/* Priority Tag (Notion style select) */}
              <span
                className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium rounded-sm truncate"
                style={{
                  backgroundColor: priorityConfig.bgVar,
                  color: priorityConfig.textVar,
                }}
              >
                {priorityConfig.label}
              </span>

              {/* Due Date Tag */}
              {todo.due_date && dueInfo.text && (
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded-sm truncate ${
                    dueInfo.isOverdue
                      ? "bg-destructive/10 text-destructive"
                      : dueInfo.isToday
                      ? "bg-warning/10 text-warning"
                      : "text-muted-foreground"
                  }`}
                >
                  <Calendar className="w-3 h-3" strokeWidth={1.5} />
                  {dueInfo.text}
                </span>
              )}

              {/* General Tags */}
              {todo.tags && todo.tags.length > 0 && (
                <>
                  {todo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-1.5 py-0.5 text-[11px] text-muted-foreground border border-border/60 bg-transparent rounded-sm truncate"
                    >
                      {tag}
                    </span>
                  ))}
                </>
              )}
              
              {/* Subtask indicator badge */}
              {hasSubtasks && !subtasksExpanded && (
                 <button 
                    onClick={() => setSubtasksExpanded(true)}
                    className="inline-flex items-center text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                 >
                    <ChevronRight className="w-3 h-3 mr-0.5" strokeWidth={1.5} />
                    {completedSubtasksCount}/{totalSubtasksCount} steps
                 </button>
              )}
            </div>
          </div>

          {/* Action Menu - only shows on hover in desktop, always on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(todo)} className="text-[13px] cursor-pointer">
                <Edit className="w-[14px] h-[14px] mr-2" strokeWidth={1.5} />
                Edit
              </DropdownMenuItem>
              {onAddSubtask && !todo.parent_id && (
                <DropdownMenuItem
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-[13px] cursor-pointer"
                >
                  <Plus className="w-[14px] h-[14px] mr-2" strokeWidth={1.5} />
                  Add Step
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onDelete}
                className="text-[13px] text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="w-[14px] h-[14px] mr-2" strokeWidth={1.5} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Subtasks Section */}
        {hasSubtasks && (
          <div className="mt-2">
            {/* Toggle button */}
            {subtasksExpanded && (
              <button
                type="button"
                onClick={() => setSubtasksExpanded(false)}
                className="flex items-center text-[11px] text-muted-foreground hover:text-foreground mb-1"
              >
                <ChevronDown className="w-3 h-3 mr-1" strokeWidth={1.5} />
                Hide steps
              </button>
            )}

            {/* Subtask list */}
            {subtasksExpanded && (
              <div className="space-y-1 pl-1 ml-[5px] border-l border-border/50">
                {todo.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 text-sm py-1 group/subtask hover:bg-muted/30 px-2 rounded-sm"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleSubtask?.(subtask.id)}
                      className="cursor-pointer flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="w-[14px] h-[14px] text-muted-foreground" strokeWidth={1.5} />
                      ) : (
                        <Circle className="w-[14px] h-[14px] text-muted-foreground/50 group-hover/subtask:text-foreground" strokeWidth={1.5} />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-[13px] ${
                        subtask.completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {subtask.title}
                    </span>
                    {onDeleteSubtask && (
                      <button
                        type="button"
                        onClick={() => onDeleteSubtask(subtask.id)}
                        className="opacity-0 group-hover/subtask:opacity-100 flex-shrink-0 text-muted-foreground hover:text-destructive transition-all"
                        title="Delete step"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inline Add Subtask Input Form */}
        {isAddingSubtask && (
          <form
            onSubmit={handleAddSubtaskSubmit}
            className="mt-2 flex items-center gap-2 pl-4"
          >
            <Input
              type="text"
              placeholder="Step title..."
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              disabled={isSubmittingSubtask}
              className="h-7 text-[13px] border-0 border-b border-border rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary px-0"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={isSubmittingSubtask || !subtaskTitle.trim()}
              className="h-7 text-[12px] px-2 font-medium"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingSubtask(false)}
              disabled={isSubmittingSubtask}
              className="h-7 text-[12px] px-2 text-muted-foreground"
            >
              Cancel
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
