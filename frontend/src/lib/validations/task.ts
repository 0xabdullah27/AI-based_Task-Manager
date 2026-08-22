/**
 * Zod Schemas for Todo Organization Features
 *
 * Spec: 002-todo-organization-features
 * Date: 2026-01-23
 *
 * These schemas extend the existing task validation schemas with
 * priority and tag support.
 */

import { z } from "zod";

// ============================================
// Priority
// ============================================

/**
 * Priority enum values
 */
export const priorityValues = ["none", "low", "medium", "high"] as const;
export type Priority = (typeof priorityValues)[number];

/**
 * Priority validation schema
 */
export const prioritySchema = z.enum(priorityValues);

/**
 * Priority display configuration
 * Updated for T002: Uses semantic CSS theme variables instead of hardcoded Tailwind colors
 * - Light mode: --priority-{level}-bg/text colors
 * - Dark mode: Colors defined separately in globals.css .dark selector
 */
export const PRIORITY_CONFIG = {
  none: {
    label: "None",
    color: "gray",
    sortOrder: 3,
    badgeStyle: {
      backgroundColor: "var(--priority-none-bg)",
      color: "var(--priority-none-text)",
      borderColor: "var(--priority-none-bg)",
    },
  },
  low: {
    label: "Low",
    color: "blue",
    sortOrder: 2,
    badgeStyle: {
      backgroundColor: "var(--priority-low-bg)",
      color: "var(--priority-low-text)",
      borderColor: "var(--priority-low-bg)",
    },
  },
  medium: {
    label: "Medium",
    color: "yellow",
    sortOrder: 1,
    badgeStyle: {
      backgroundColor: "var(--priority-medium-bg)",
      color: "var(--priority-medium-text)",
      borderColor: "var(--priority-medium-bg)",
    },
  },
  high: {
    label: "High",
    color: "red",
    sortOrder: 0,
    badgeStyle: {
      backgroundColor: "var(--priority-high-bg)",
      color: "var(--priority-high-text)",
      borderColor: "var(--priority-high-bg)",
    },
  },
} as const;

// ============================================
// Tags
// ============================================

/**
 * Single tag validation
 * - No spaces (single word)
 * - Max 50 characters
 * - Non-empty
 */
export const tagSchema = z
  .string()
  .min(1, "Tag cannot be empty")
  .max(50, "Tag must be 50 characters or less")
  .refine((val) => !val.includes(" "), {
    message: "Tags must be single words (no spaces)",
  })
  .transform((val) => val.toLowerCase()); // Store lowercase

/**
 * Tags array validation
 * - Max 20 tags per task
 * - Deduplicates automatically
 */
export const tagsArraySchema = z
  .array(tagSchema)
  .max(20, "Maximum 20 tags allowed")
  .transform((tags) => [...new Set(tags)]); // Dedupe

/**
 * Tag response schema (from API)
 */
export const tagReadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  task_count: z.number().int().nonnegative(),
});

export type TagRead = z.infer<typeof tagReadSchema>;

// ============================================
// Task Schemas (Extended)
// ============================================

/**
 * Task creation schema with priority and tags
 */
export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .nullable(),
  priority: prioritySchema.default("none"),
  tags: tagsArraySchema.default([]),
  parent_id: z.string().uuid().nullable().optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

/**
 * Task update schema with priority and tags
 */
export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .nullable(),
  completed: z.boolean().optional(),
  priority: prioritySchema.optional(),
  tags: tagsArraySchema.optional(),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.number().int().min(1).optional(),
});

export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

/**
 * Task response schema (from API)
 */
export interface TaskRead {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  tags: string[];
  parent_id: string | null;
  position: number | null;
  subtasks: TaskRead[];
  created_at: string;
  updated_at: string | null;
}

export const taskReadSchema: z.ZodType<TaskRead> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    completed: z.boolean(),
    priority: prioritySchema,
    tags: z.array(z.string()),
    parent_id: z.string().uuid().nullable(),
    position: z.number().int().nullable(),
    subtasks: z.array(taskReadSchema),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime().nullable(),
  })
);

/**
 * Task list response schema
 */
export const taskListResponseSchema = z.object({
  tasks: z.array(taskReadSchema),
  total: z.number().int().nonnegative(),
  filtered: z.number().int().nonnegative(),
});

export type TaskListResponse = z.infer<typeof taskListResponseSchema>;

// ============================================
// Filter Schemas
// ============================================

/**
 * Status filter options
 */
export const statusFilterValues = ["all", "pending", "completed"] as const;
export type StatusFilter = (typeof statusFilterValues)[number];
export const statusFilterSchema = z.enum(statusFilterValues);

/**
 * Priority filter options (includes 'all')
 */
export const priorityFilterValues = [
  "all",
  "high",
  "medium",
  "low",
  "none",
] as const;
export type PriorityFilter = (typeof priorityFilterValues)[number];
export const priorityFilterSchema = z.enum(priorityFilterValues);

/**
 * Sort field options
 */
export const sortFieldValues = ["priority", "title", "created_at"] as const;
export type SortField = (typeof sortFieldValues)[number];
export const sortFieldSchema = z.enum(sortFieldValues);

/**
 * Sort order options
 */
export const sortOrderValues = ["asc", "desc"] as const;
export type SortOrder = (typeof sortOrderValues)[number];
export const sortOrderSchema = z.enum(sortOrderValues);

/**
 * Task filters state schema
 */
export const taskFiltersSchema = z.object({
  status: statusFilterSchema.default("all"),
  priority: priorityFilterSchema.default("all"),
  tags: z.array(z.string()).default([]),
  noTags: z.boolean().default(false),
});

export type TaskFilters = z.infer<typeof taskFiltersSchema>;

/**
 * Task query parameters schema
 */
export const taskQueryParamsSchema = z.object({
  search: z.string().max(200).optional(),
  status: statusFilterSchema.default("all"),
  priority: priorityFilterSchema.default("all"),
  tags: z.array(z.string()).optional(),
  noTags: z.boolean().default(false),
  sort: sortFieldSchema.default("priority"),
  order: sortOrderSchema.optional(),
});

export type TaskQueryParams = z.infer<typeof taskQueryParamsSchema>;

// ============================================
// Sort Configuration
// ============================================

/**
 * Default sort order per field
 */
export const DEFAULT_SORT_ORDER: Record<SortField, SortOrder> = {
  priority: "asc", // High first (0, 1, 2, 3)
  title: "asc", // A to Z
  created_at: "desc", // Newest first
};

/**
 * Sort display labels
 */
export const SORT_LABELS: Record<SortField, string> = {
  priority: "Priority (highest first)",
  title: "Title (A to Z)",
  created_at: "Creation date (newest first)",
};

// ============================================
// Filter Display Labels
// ============================================

export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All tasks",
  pending: "Pending",
  completed: "Completed",
};

export const PRIORITY_FILTER_LABELS: Record<PriorityFilter, string> = {
  all: "All priorities",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

// ============================================
// LocalStorage Keys
// ============================================

export const STORAGE_KEYS = {
  SORT_PREFERENCE: "todo-sort-preference",
} as const;
