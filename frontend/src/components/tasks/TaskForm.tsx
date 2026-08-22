/**
 * TaskForm - Form component for creating and editing tasks
 * Spec: 001-todo-web-crud, 002-todo-organization-features
 * Task: T079, T112, T037, T057
 */

"use client";

import React, { useEffect } from "react";
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

export function TaskForm({
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
  mode = "create"
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: { priority: "low", tags: [], ...defaultValues },
  });

  const { tags, isLoading: tagsLoading, fetchTags } = useTags();
  const watchedTags = watch("tags", defaultValues?.tags || []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleFormSubmit = async (data: TaskCreateInput) => {
    await onSubmit(data);
    // Note: Create form is remounted via key prop in parent component
    // Edit form stays mounted and user can cancel or continue editing
    if (mode === "edit") {
      // Could add success feedback here if needed
    }
  };

  return (
    // T039: Update modal styling with opaque background
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        {/* T043: Update form label styling to use --foreground variable */}
        <label htmlFor="title" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Title
        </label>
        {/* T041: Use semantic input field styling */}
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
        {/* T043: Form label styling */}
        <label htmlFor="description" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Description (Optional)
        </label>
        {/* T041: Input field styling */}
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
        {/* T043: Form label styling */}
        <label htmlFor="priority" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Priority
        </label>
        {/* T046: Replace priority selector styling with semantic variables */}
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
        {/* T043: Form label styling */}
        <label htmlFor="tags" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Tags (Optional)
        </label>
        {/* T045: Update tag input styling */}
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
