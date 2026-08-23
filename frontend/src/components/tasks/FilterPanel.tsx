/**
 * FilterPanel component - Task filters
 * Spec: 002-todo-organization-features
 * Task: T087, T088
 */

import { useState } from "react";
import { X } from "lucide-react";
import type { TaskFilters, SortField, SortOrder } from "@/types/task";
import {
  statusFilterValues,
  priorityFilterValues,
  STATUS_FILTER_LABELS,
  PRIORITY_FILTER_LABELS
} from "@/lib/validations/task";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  availableTags: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  availableTags,
  onClearFilters,
  hasActiveFilters
}: FilterPanelProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status as "all" | "pending" | "completed",
    });
  };

  const handlePriorityChange = (priority: string) => {
    onFiltersChange({
      ...filters,
      priority: priority as "all" | "high" | "medium" | "low",
    });
  };

  const handleTagToggle = (tagName: string) => {
    const newTags = filters.tags.includes(tagName)
      ? filters.tags.filter(tag => tag !== tagName)
      : [...filters.tags, tagName];

    onFiltersChange({
      ...filters,
      tags: newTags,
    });
  };

  const handleNoTagsToggle = () => {
    onFiltersChange({
      ...filters,
      noTags: !filters.noTags,
    });
  };

  return (
    <div className="mb-4 p-4 rounded-md border border-border bg-card text-card-foreground shadow-xs transition">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="filter-status" className="block text-sm font-medium mb-1 text-foreground">
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-primary transition"
          >
            {statusFilterValues.map((status) => (
              <option key={status} value={status} className="bg-card text-foreground">
                {STATUS_FILTER_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label htmlFor="filter-priority" className="block text-sm font-medium mb-1 text-foreground">
            Priority
          </label>
          <select
            id="filter-priority"
            value={filters.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-primary transition"
          >
            {priorityFilterValues.map((priority) => (
              <option key={priority} value={priority} className="bg-card text-foreground">
                {PRIORITY_FILTER_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Filter */}
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">
            Tags
          </label>
          <div className="relative">
            <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto">
              {filters.tags.map((tag, index) => (
                <span
                  key={`selected-${tag}-${index}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground border border-primary/30 transition"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className="ml-1 focus:outline-none hover:opacity-70 transition cursor-pointer"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {filters.noTags && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border transition"
                >
                  No tags
                  <button
                    type="button"
                    onClick={handleNoTagsToggle}
                    className="ml-1 focus:outline-none hover:opacity-70 transition cursor-pointer"
                    aria-label="Remove 'No tags' filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="w-full text-left rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-primary transition cursor-pointer"
            >
              Select tags...
            </button>

            {showTagDropdown && (
              <div className="absolute z-10 mt-1 w-full rounded-md shadow-lg border border-border bg-card text-card-foreground max-h-60 overflow-auto transition">
                <div className="py-1">
                  {availableTags.map((tag) => (
                    <div
                      key={tag}
                      className={cn(
                        "px-4 py-2 text-sm cursor-pointer transition",
                        filters.tags.includes(tag)
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground hover:bg-muted"
                      )}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                  {availableTags.length === 0 && (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      No tags available
                    </div>
                  )}

                  {/* "No tags" option */}
                  <div
                    className={cn(
                      "px-4 py-2 text-sm cursor-pointer transition",
                      filters.noTags
                        ? "bg-muted text-muted-foreground font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                    onClick={handleNoTagsToggle}
                  >
                    No tags
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center px-3 py-1.5 border border-border bg-card text-foreground text-xs font-medium rounded transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
