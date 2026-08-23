/**
 * TaskForm - Form component for creating and editing tasks
 * Spec: 001-todo-web-crud, 002-todo-organization-features
 * Task: T079, T112, T037, T057
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskCreateSchema, type TaskCreateInput, priorityValues, PRIORITY_CONFIG } from "@/lib/validations/task";
import { Button } from "@/components/ui/Button";
import { TagInput } from "./TagInput";
import { useTags } from "@/hooks/useTags";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [calendarOpen, setCalendarOpen] = useState(false);

  const formattedDefaultValues = useMemo(() => {
    return {
      priority: "low" as const,
      tags: [] as string[],
      ...defaultValues,
      due_date: defaultValues?.due_date || "",
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
  const dueDateValue = watch("due_date");

  const selectedDate = useMemo(() => {
    if (!dueDateValue) return undefined;
    const d = new Date(dueDateValue);
    return isNaN(d.getTime()) ? undefined : d;
  }, [dueDateValue]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    if (defaultValues) {
      reset({
        priority: "low",
        tags: [],
        ...defaultValues,
        due_date: defaultValues.due_date || "",
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
        const dateObj = new Date(trimmed);
        if (!isNaN(dateObj.getTime())) {
          processedDueDate = dateObj.toISOString();
        } else {
          processedDueDate = null;
        }
      }
    } else {
      processedDueDate = null;
    }

    const submitPayload: TaskCreateInput = {
      title: data.title,
      priority: data.priority,
      tags: data.tags || [],
    };
    if (data.description) {
      submitPayload.description = data.description;
    }
    if (processedDueDate) {
      submitPayload.due_date = processedDueDate;
    }
    if (data.parent_id) {
      submitPayload.parent_id = data.parent_id;
    }

    await onSubmit(submitPayload);
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          {...register("title")}
          id="title"
          type="text"
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed transition"
          placeholder="Enter task title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description (Optional)
        </label>
        <textarea
          {...register("description")}
          id="description"
          rows={3}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed transition"
          placeholder="Enter task description"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-foreground">
          Priority
        </label>
        <select
          {...register("priority")}
          id="priority"
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed transition"
        >
          {priorityValues.map((priority) => (
            <option key={priority} value={priority} className="bg-card text-foreground">
              {PRIORITY_CONFIG[priority].label}
            </option>
          ))}
        </select>
        {errors.priority && (
          <p className="mt-1 text-sm text-destructive">
            {errors.priority.message}
          </p>
        )}
      </div>

      {/* Shadcn UI Calendar Date Picker */}
      <div>
        <label htmlFor="due_date" className="block text-sm font-medium mb-1 text-foreground">
          Due Date (Optional)
        </label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              id="due_date"
              disabled={isLoading}
              className={cn(
                "mt-1 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-input bg-card text-foreground text-left text-sm transition shadow-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed cursor-pointer",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a due date...</span>}
              </span>
              {selectedDate && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setValue("due_date", "", { shouldValidate: true });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setValue("due_date", "", { shouldValidate: true });
                    }
                  }}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                  title="Clear due date"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50 border border-border bg-popover text-popover-foreground shadow-xl rounded-xl" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  // Set time to end of day (23:59:00) so the due date covers the full day
                  const fullDate = new Date(date);
                  fullDate.setHours(23, 59, 0, 0);
                  setValue("due_date", fullDate.toISOString(), { shouldValidate: true });
                } else {
                  setValue("due_date", "", { shouldValidate: true });
                }
                setCalendarOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.due_date && (
          <p className="mt-1 text-sm text-destructive">
            {errors.due_date.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-foreground">
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
          <p className="mt-1 text-sm text-destructive">
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
