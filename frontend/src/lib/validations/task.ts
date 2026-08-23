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
 * Note: there is no "none" level — unspecified priority defaults to "low".
 */
export const priorityValues = ["low", "medium", "high"] as const;
export type Priority = (typeof priorityValues)[number];

/**
 * Priority validation schema
 */
export const prioritySchema = z.enum(priorityValues);

/**
 * Priority display configuration
 * Uses semantic Tailwind utility classes mapped to @theme in globals.css
 */
export const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    color: "low",
    sortOrder: 2,
    className: "bg-priority-low text-priority-low-foreground border-priority-low/30",
    bgClass: "bg-priority-low",
    textClass: "text-priority-low-foreground",
    borderClass: "border-priority-low",
    badgeStyle: {
      backgroundColor: "var(--priority-low-bg)",
      color: "var(--priority-low-text)",
      borderColor: "var(--priority-low-bg)",
    },
  },
  medium: {
    label: "Medium",
    color: "medium",
    sortOrder: 1,
    className: "bg-priority-medium text-priority-medium-foreground border-priority-medium/30",
    bgClass: "bg-priority-medium",
    textClass: "text-priority-medium-foreground",
    borderClass: "border-priority-medium",
    badgeStyle: {
      backgroundColor: "var(--priority-medium-bg)",
      color: "var(--priority-medium-text)",
      borderColor: "var(--priority-medium-bg)",
    },
  },
  high: {
    label: "High",
    color: "high",
    sortOrder: 0,
    className: "bg-priority-high text-priority-high-foreground border-priority-high/30",
    bgClass: "bg-priority-high",
    textClass: "text-priority-high-foreground",
    borderClass: "border-priority-high",
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
  priority: prioritySchema.default("low"),
  tags: tagsArraySchema.default([]),
  due_date: z.string().nullable().optional(),
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
  due_date: z.string().nullable().optional(),
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
  due_date?: string | null;
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
    due_date: z.string().nullable().optional(),
    parent_id: z.string().uuid().nullable(),
    position: z.number().int().nullable(),
    subtasks: z.array(taskReadSchema),
    created_at: z.string(),
    updated_at: z.string().nullable(),
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
  priority: "asc", // High first (0, 1, 2)
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
};

// ============================================
// LocalStorage Keys
// ============================================

export const STORAGE_KEYS = {
  SORT_PREFERENCE: "todo-sort-preference",
} as const;
