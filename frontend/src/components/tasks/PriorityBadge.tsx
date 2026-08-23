/**
 * PriorityBadge component - Visual priority indicator
 *
 * Spec: 002-todo-organization-features
 * Displays priority level with appropriate color coding
 */

import { PRIORITY_CONFIG, type Priority } from "@/lib/validations/task";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: Priority;
  size?: "sm" | "md";
  className?: string;
}

export function PriorityBadge({ priority, size = "md", className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium transition",
        sizeClasses[size],
        config?.className || "bg-priority-low text-priority-low-foreground border-priority-low/30",
        className
      )}
      aria-label={`Priority: ${config?.label || priority}`}
    >
      {config?.label || priority}
    </span>
  );
}
