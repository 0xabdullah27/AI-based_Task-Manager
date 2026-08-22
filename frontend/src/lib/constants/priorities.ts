/**
 * Priority constants and configuration
 *
 * Spec: 002-todo-organization-features
 * Date: 2026-01-23
 */

import type { Priority } from "@/lib/validations/task";

/**
 * Priority color configuration
 * Maps priority levels to theme CSS variables
 */
export const PRIORITY_COLORS: Record<
  Priority,
  {
    badge: string;
    bg: string;
    text: string;
    border: string;
  }
> = {
  high: {
    badge: "var(--priority-high-bg) var(--priority-high-text)",
    bg: "var(--priority-high-bg)",
    text: "var(--priority-high-text)",
    border: "var(--priority-high-bg)",
  },
  medium: {
    badge: "var(--priority-medium-bg) var(--priority-medium-text)",
    bg: "var(--priority-medium-bg)",
    text: "var(--priority-medium-text)",
    border: "var(--priority-medium-bg)",
  },
  low: {
    badge: "var(--priority-low-bg) var(--priority-low-text)",
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
