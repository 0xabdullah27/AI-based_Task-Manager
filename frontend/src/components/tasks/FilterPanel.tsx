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
    // T059: Replace hardcoded colors with semantic theme variables
    <div className="mb-4 p-4 rounded-md border transition" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 transition"
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
            {statusFilterValues.map((status) => (
              <option key={status} value={status}>
                {STATUS_FILTER_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 transition"
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
            {priorityFilterValues.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_FILTER_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Filter */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
            Tags
          </label>
          <div className="relative">
            <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto">
              {filters.tags.map((tag, index) => (
                <span
                  key={`selected-${tag}-${index}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                    borderColor: "var(--primary)",
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className="ml-1 focus:outline-none hover:opacity-70 transition"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {filters.noTags && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition"
                  style={{
                    backgroundColor: "var(--muted)",
                    color: "var(--muted-foreground)",
                    borderColor: "var(--border)",
                  }}
                >
                  No tags
                  <button
                    type="button"
                    onClick={handleNoTagsToggle}
                    className="ml-1 focus:outline-none hover:opacity-70 transition"
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
              className="w-full text-left rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 transition"
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
              Select tags...
            </button>

            {showTagDropdown && (
              <div className="absolute z-10 mt-1 w-full rounded-md shadow-lg border max-h-60 overflow-auto transition" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                <div className="py-1">
                  {availableTags.map((tag) => (
                    <div
                      key={tag}
                      className="px-4 py-2 text-sm cursor-pointer transition hover:opacity-70"
                      style={{
                        backgroundColor: filters.tags.includes(tag) ? "var(--primary)" : "transparent",
                        color: filters.tags.includes(tag) ? "var(--primary-foreground)" : "var(--foreground)",
                      }}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                  {availableTags.length === 0 && (
                    <div className="px-4 py-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      No tags available
                    </div>
                  )}

                  {/* "No tags" option */}
                  <div
                    className="px-4 py-2 text-sm cursor-pointer transition hover:opacity-70"
                    style={{
                      backgroundColor: filters.noTags ? "var(--muted)" : "transparent",
                      color: filters.noTags ? "var(--muted-foreground)" : "var(--foreground)",
                    }}
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
            className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded transition focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              borderColor: "var(--border)",
              color: "var(--foreground)",
              backgroundColor: "var(--card)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--card)";
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
