/**
 * Priority constants and configuration
 *
 * Spec: 002-todo-organization-features
 * Date: 2026-01-23
 */

import type { Priority } from "@/lib/validations/task";

/**
 * Priority color configuration
 * Maps priority levels to Tailwind utility classes and theme tokens
 */
export const PRIORITY_COLORS: Record<
  Priority,
  {
    className: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badge: string;
    bg: string;
    text: string;
    border: string;
  }
> = {
  high: {
    className: "bg-priority-high text-priority-high-foreground border-priority-high/30",
    bgClass: "bg-priority-high",
    textClass: "text-priority-high-foreground",
    borderClass: "border-priority-high",
    badge: "bg-priority-high text-priority-high-foreground",
    bg: "var(--priority-high-bg)",
    text: "var(--priority-high-text)",
    border: "var(--priority-high-bg)",
  },
  medium: {
    className: "bg-priority-medium text-priority-medium-foreground border-priority-medium/30",
    bgClass: "bg-priority-medium",
    textClass: "text-priority-medium-foreground",
    borderClass: "border-priority-medium",
    badge: "bg-priority-medium text-priority-medium-foreground",
    bg: "var(--priority-medium-bg)",
    text: "var(--priority-medium-text)",
    border: "var(--priority-medium-bg)",
  },
  low: {
    className: "bg-priority-low text-priority-low-foreground border-priority-low/30",
    bgClass: "bg-priority-low",
    textClass: "text-priority-low-foreground",
    borderClass: "border-priority-low",
    badge: "bg-priority-low text-priority-low-foreground",
    bg: "var(--priority-low-bg)",
    text: "var(--priority-low-text)",
    border: "var(--priority-low-bg)",
  },
};

/**
 * Priority display labels
 */
export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/**
 * Priority sort order (for client-side sorting)
 */
export const PRIORITY_SORT_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
