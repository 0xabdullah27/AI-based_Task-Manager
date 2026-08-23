import type { Todo } from "@/types/task";

/**
 * Priority configuration with semantic Tailwind utility classes
 * Variables are mapped to Tailwind @theme in frontend/src/app/globals.css
 */
export interface PriorityConfig {
  label: string;
  color: string;
  variant: "destructive" | "warning" | "success" | "secondary";
  className: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  /** CSS variables for backwards compatibility if referenced */
  bgVar: string;
  textVar: string;
}

export const priorityColors: Record<
  Todo["priority"],
  PriorityConfig
> = {
  high: {
    label: "High",
    color: "destructive",
    variant: "destructive",
    className: "bg-priority-high text-priority-high-foreground border-priority-high/30",
    bgClass: "bg-priority-high",
    textClass: "text-priority-high-foreground",
    borderClass: "border-priority-high",
    bgVar: "var(--priority-high-bg)",
    textVar: "var(--priority-high-text)",
  },
  medium: {
    label: "Medium",
    color: "warning",
    variant: "warning",
    className: "bg-priority-medium text-priority-medium-foreground border-priority-medium/30",
    bgClass: "bg-priority-medium",
    textClass: "text-priority-medium-foreground",
    borderClass: "border-priority-medium",
    bgVar: "var(--priority-medium-bg)",
    textVar: "var(--priority-medium-text)",
  },
  low: {
    label: "Low",
    color: "success",
    variant: "success",
    className: "bg-priority-low text-priority-low-foreground border-priority-low/30",
    bgClass: "bg-priority-low",
    textClass: "text-priority-low-foreground",
    borderClass: "border-priority-low",
    bgVar: "var(--priority-low-bg)",
    textVar: "var(--priority-low-text)",
  },
};

export function getPriorityConfig(
  priority: Todo["priority"]
): PriorityConfig {
  return priorityColors[priority] || priorityColors.low;
}

export function getPriorityColor(priority: Todo["priority"]): string {
  return getPriorityConfig(priority).color;
}

