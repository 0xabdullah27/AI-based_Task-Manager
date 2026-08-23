/**
 * TaskForm - Form component for creating and editing tasks
 * Spec: 001-todo-web-crud, 002-todo-organization-features
 * Task: T079, T112, T037, T057
 */

"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskCreateSchema, type TaskCreateInput, priorityValues, PRIORITY_CONFIG } from "@/lib/validations/task";
import { Button } from "@/components/ui/Button";
import { TagInput } from "./TagInput";
import { useTags } from "@/hooks/useTags";

interface TaskFormProps {
  onSubmit: (data: TaskCreateInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultValues?: Partial<TaskCreateInput>;
  mode?: "create" | "edit";
}

/**
 * Helper to format ISO datetime string (e.g. "2026-08-23T14:30:00Z")
 * into "YYYY-MM-DDTHH:mm" format required by <input type="datetime-local">.
 */
function formatForDateTimeLocal(isoStr?: string | null): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

export function TaskForm({
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
  mode = "create"
}: TaskFormProps) {
  const formattedDefaultValues = useMemo(() => {
    return {
      priority: "low" as const,
      tags: [] as string[],
      ...defaultValues,
      due_date: defaultValues?.due_date ? formatForDateTimeLocal(defaultValues.due_date) : "",
    };
  }, [defaultValues]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: formattedDefaultValues,
  });

  const { tags, isLoading: tagsLoading, fetchTags } = useTags();
  const watchedTags = watch("tags", defaultValues?.tags || []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    if (defaultValues) {
      reset({
        priority: "low",
        tags: [],
        ...defaultValues,
        due_date: defaultValues.due_date ? formatForDateTimeLocal(defaultValues.due_date) : "",
      });
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = async (data: TaskCreateInput) => {
    let processedDueDate: string | null | undefined = data.due_date;
    if (processedDueDate) {
      const trimmed = processedDueDate.trim();
      if (!trimmed) {
        processedDueDate = null;
      } else {
        // If user picked/entered a date without explicit time, default to end of day (23:59)
        const valToParse = trimmed.includes("T") ? trimmed : `${trimmed}T23:59`;
        const dateObj = new Date(valToParse);
        if (!isNaN(dateObj.getTime())) {
          processedDueDate = dateObj.toISOString();
        } else {
          processedDueDate = null;
        }
      }
    } else {
      processedDueDate = null;
    }

    await onSubmit({
      ...data,
      due_date: processedDueDate,
    });
  };

  return (
    // noValidate prevents native browser incomplete-datetime popups while RHF/Zod handles validation
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Title
        </label>
        <input
          {...register("title")}
          id="title"
          type="text"
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed transition"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--input-text)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.boxShadow = "0 0 0 1px var(--primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--input-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
          placeholder="Enter task title"
        />
        {errors.title && (
          <p className="mt-1 text-sm" style={{ color: "var(--error-text)" }}>
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Description (Optional)
        </label>
        <textarea
          {...register("description")}
          id="description"
          rows={3}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed transition"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--input-text)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.boxShadow = "0 0 0 1px var(--primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--input-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
          placeholder="Enter task description"
        />
        {errors.description && (
          <p className="mt-1 text-sm" style={{ color: "var(--error-text)" }}>
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Priority
        </label>
        <select
          {...register("priority")}
          id="priority"
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed transition"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--input-text)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.boxShadow = "0 0 0 1px var(--primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--input-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {priorityValues.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_CONFIG[priority].label}
            </option>
          ))}
        </select>
        {errors.priority && (
          <p className="mt-1 text-sm" style={{ color: "var(--error-text)" }}>
            {errors.priority.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="due_date" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Due Date (Optional)
        </label>
        <input
          {...register("due_date")}
          id="due_date"
          type="datetime-local"
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed transition"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--input-text)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.boxShadow = "0 0 0 1px var(--primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--input-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {errors.due_date && (
          <p className="mt-1 text-sm" style={{ color: "var(--error-text)" }}>
            {errors.due_date.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Tags (Optional)
        </label>
        <TagInput
          value={watchedTags}
          onChange={(newTags) => setValue("tags", newTags, { shouldValidate: true })}
          suggestions={tags.map(tag => tag.name)}
          disabled={isLoading || tagsLoading}
          placeholder="Add tags (comma or enter to add)..."
        />
        {errors.tags && (
          <p className="mt-1 text-sm" style={{ color: "var(--error-text)" }}>
            {errors.tags.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {mode === "edit" && onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          disabled={isLoading}
        >
          {mode === "edit"
            ? isLoading
              ? "Saving..."
              : "Save Changes"
            : isLoading
            ? "Creating..."
            : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
