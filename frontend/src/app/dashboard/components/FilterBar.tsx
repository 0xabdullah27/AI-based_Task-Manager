"use client";

import { useMemo, useState } from "react";
import { Search, X, Tag as TagIcon, Check, ChevronDown, Filter } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Priority } from "@/lib/validations/task";

export type FilterStatus = "all" | "active" | "completed";
export type QuickPreset = "overdue" | "today" | "tomorrow" | "high_priority";

export interface FilterState {
  search: string;
  status: FilterStatus;
  quickPreset: QuickPreset | null;
  priority: Priority | "all";
  selectedTags: string[];
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableTags: string[];
  totalCount: number;
  filteredCount: number;
}

const PRESET_LABELS: Record<QuickPreset, string> = {
  overdue: "Overdue",
  today: "Due Today",
  tomorrow: "Due Tomorrow",
  high_priority: "High Priority",
};

export function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  availableTags,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const [tagSearch, setTagSearch] = useState("");

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search.trim().length > 0 ||
      filters.status !== "active" ||
      filters.quickPreset !== null ||
      filters.priority !== "all" ||
      filters.selectedTags.length > 0
    );
  }, [filters]);

  const toggleTag = (tag: string) => {
    const isSelected = filters.selectedTags.includes(tag);
    const updated = isSelected
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onFilterChange({ selectedTags: updated });
  };

  const handleQuickPreset = (preset: QuickPreset) => {
    if (filters.quickPreset === preset) {
      onFilterChange({ quickPreset: null });
    } else {
      onFilterChange({ quickPreset: preset, priority: "all" });
    }
  };

  const handlePrioritySelect = (pOption: Priority | "all") => {
    const updatedPreset = filters.quickPreset === "high_priority" ? null : filters.quickPreset;
    onFilterChange({ priority: pOption, quickPreset: updatedPreset });
  };

  const filteredAvailableTags = useMemo(() => {
    if (!tagSearch.trim()) return availableTags;
    return availableTags.filter((tag) =>
      tag.toLowerCase().includes(tagSearch.toLowerCase().trim())
    );
  }, [availableTags, tagSearch]);

  return (
    <div className="space-y-3 py-2 border-b border-border mb-4">
      {/* Row 1: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md">
          {(["active", "all", "completed"] as FilterStatus[]).map((statusOption) => {
            const isActive = filters.status === statusOption;
            const label =
              statusOption === "all"
                ? "All Tasks"
                : statusOption.charAt(0).toUpperCase() + statusOption.slice(1);
            return (
              <button
                key={statusOption}
                onClick={() => onFilterChange({ status: statusOption })}
                className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer select-none ${
                  isActive
                    ? "bg-background shadow-xs text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-8 pr-8 h-8 text-sm bg-transparent border-border hover:bg-muted/20 focus:bg-background transition shadow-none"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Refinements */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0 mr-1" strokeWidth={1.5} />
        
        {/* Quick Presets */}
        <button
          onClick={() => handleQuickPreset("overdue")}
          className={`h-7 px-2.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
            filters.quickPreset === "overdue"
              ? "bg-destructive/10 text-destructive font-medium"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Overdue
        </button>

        <button
          onClick={() => handleQuickPreset("today")}
          className={`h-7 px-2.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
            filters.quickPreset === "today"
              ? "bg-muted text-foreground font-medium border border-border/50 shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Due Today
        </button>

        <button
          onClick={() => handleQuickPreset("tomorrow")}
          className={`h-7 px-2.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
            filters.quickPreset === "tomorrow"
              ? "bg-muted text-foreground font-medium border border-border/50 shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Due Tomorrow
        </button>
        
        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Priority Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`h-7 px-2.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                filters.priority !== "all"
                  ? "bg-muted text-foreground font-medium border border-border/50 shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Priority: <span className="capitalize">{filters.priority}</span></span>
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-32 p-1">
            {(["all", "high", "medium", "low"] as const).map((pOption) => (
              <button
                key={pOption}
                onClick={() => handlePrioritySelect(pOption)}
                className={`w-full text-left px-2 py-1.5 rounded-sm text-xs transition cursor-pointer capitalize flex items-center justify-between ${
                  filters.priority === pOption
                    ? "bg-muted text-foreground font-medium"
                    : "hover:bg-muted/50 text-foreground"
                }`}
              >
                <span>{pOption}</span>
                {filters.priority === pOption && <Check className="w-3.5 h-3.5" strokeWidth={1.5} />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Tag Popover */}
        {availableTags.length > 0 && (
          <div className="flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`h-7 px-2.5 text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                    filters.selectedTags.length > 0
                      ? "bg-muted text-foreground font-medium rounded-l border border-border/50 border-r-0 shadow-xs"
                      : "text-muted-foreground hover:bg-muted rounded"
                  }`}
                >
                  <TagIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Tags {filters.selectedTags.length > 0 && `(${filters.selectedTags.length})`}</span>
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                <div className="px-2 py-1 mb-1 flex items-center gap-1">
                  <Input
                    type="text"
                    placeholder="Filter tags..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="h-7 text-xs shadow-none bg-muted/30 border-none focus-visible:ring-0 px-2 flex-1"
                  />
                  {filters.selectedTags.length > 0 && (
                    <button
                      onClick={() => onFilterChange({ selectedTags: [] })}
                      className="h-7 w-7 flex items-center justify-center shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground rounded transition-colors cursor-pointer"
                      title="Clear tags"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredAvailableTags.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 py-1">No tags found</p>
                  ) : (
                    filteredAvailableTags.map((tag) => {
                      const isSelected = filters.selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-sm text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-muted text-foreground font-medium"
                              : "hover:bg-muted/50 text-foreground"
                          }`}
                        >
                          <span className="truncate">#{tag}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-foreground" strokeWidth={1.5} />}
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Split button to clear tags easily */}
            {filters.selectedTags.length > 0 && (
              <button
                onClick={() => onFilterChange({ selectedTags: [] })}
                className="h-7 px-1.5 bg-muted text-foreground hover:bg-muted/80 rounded-r transition-colors cursor-pointer border border-border/50 border-l-border shrink-0 flex items-center justify-center shadow-xs"
                title="Clear selected tags"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Clear All */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 transition shrink-0 ml-auto"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
