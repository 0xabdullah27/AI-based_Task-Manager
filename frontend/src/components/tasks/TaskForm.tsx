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
import { Calendar as CalendarIcon, X, Tag, Flag } from "lucide-react";
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
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 pt-2">
      {/* Title Input */}
      <div>
        <input
          {...register("title")}
          id="title"
          type="text"
          disabled={isLoading}
          className="block w-full border-0 bg-transparent text-foreground placeholder:text-muted-foreground/60 text-3xl font-bold focus:outline-none focus:ring-0 disabled:cursor-not-allowed transition p-0"
          placeholder="Untitled"
          autoFocus
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description Input */}
      <div>
        <textarea
          {...register("description")}
          id="description"
          rows={3}
          disabled={isLoading}
          className="block w-full border-0 bg-transparent text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:ring-0 disabled:cursor-not-allowed transition p-0 resize-none"
          placeholder="Add description or notes..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Properties (Notion Style Grid) */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        
        {/* Due Date Property */}
        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
          <label htmlFor="due_date" className="text-sm text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" strokeWidth={1.5} />
            Due date
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                id="due_date"
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 -ml-2 rounded text-left text-sm transition hover:bg-muted/50 focus:outline-none disabled:cursor-not-allowed cursor-pointer w-fit",
                  !selectedDate ? "text-muted-foreground/60" : "text-foreground"
                )}
              >
                {selectedDate ? format(selectedDate, "PPP") : <span>Empty</span>}
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
                    className="p-0.5 rounded-full hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition cursor-pointer"
                    title="Clear due date"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
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
        </div>
        {errors.due_date && (
          <p className="mt-1 text-sm text-destructive pl-[116px]">
            {errors.due_date.message}
          </p>
        )}

        {/* Priority Property */}
        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
          <label htmlFor="priority" className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Flag className="w-4 h-4" strokeWidth={1.5} />
            Priority
          </label>
          <div className="-ml-2">
            <select
              {...register("priority")}
              id="priority"
              disabled={isLoading}
              className="bg-transparent border-0 text-foreground px-2 py-1 text-sm hover:bg-muted/50 rounded focus:outline-none focus:ring-0 disabled:cursor-not-allowed transition cursor-pointer appearance-none w-fit"
            >
              {priorityValues.map((priority) => (
                <option key={priority} value={priority} className="bg-card text-foreground">
                  {PRIORITY_CONFIG[priority].label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {errors.priority && (
          <p className="mt-1 text-sm text-destructive pl-[116px]">
            {errors.priority.message}
          </p>
        )}

        {/* Tags Property */}
        <div className="grid grid-cols-[100px_1fr] items-start gap-4">
          <label htmlFor="tags" className="text-sm text-muted-foreground flex items-center gap-1.5 pt-1.5">
            <Tag className="w-4 h-4" strokeWidth={1.5} />
            Tags
          </label>
          <div className="-ml-2 w-full max-w-sm">
            <TagInput
              value={watchedTags}
              onChange={(newTags) => setValue("tags", newTags, { shouldValidate: true })}
              suggestions={tags.map(tag => tag.name)}
              disabled={isLoading || tagsLoading}
              placeholder="Empty"
              className="border-0 bg-transparent shadow-none hover:bg-muted/20 px-2 py-1 text-sm transition focus-within:ring-0 focus-within:bg-muted/10 h-auto min-h-0"
            />
          </div>
        </div>
        {errors.tags && (
          <p className="mt-1 text-sm text-destructive pl-[116px]">
            {errors.tags.message}
          </p>
        )}

      </div>

      <div className="flex justify-end gap-2 pt-6">
        {mode === "edit" && onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          disabled={isLoading}
          className="bg-foreground text-background hover:bg-foreground/90 shadow-none font-medium"
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
