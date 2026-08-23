"use client";

import { useMemo, useState } from "react";
import { Search, X, Tag as TagIcon, Check, ChevronDown, Sparkles, Filter } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim().length > 0) count++;
    if (filters.status !== "active") count++;
    if (filters.quickPreset !== null) count++;
    if (filters.priority !== "all") count++;
    if (filters.selectedTags.length > 0) count += filters.selectedTags.length;
    return count;
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
      onFilterChange({ quickPreset: preset });
    }
  };

  const filteredAvailableTags = useMemo(() => {
    if (!tagSearch.trim()) return availableTags;
    return availableTags.filter((tag) =>
      tag.toLowerCase().includes(tagSearch.toLowerCase().trim())
    );
  }, [availableTags, tagSearch]);

  return (
    <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-md p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Row 1: Search Input & Segmented Status Tabs */}
      <div className="flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks by title, description, or #tag..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10 pr-9 h-10 bg-muted/40 border-border/70 focus:bg-background focus:ring-2 focus:ring-primary/20 transition rounded-lg text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 self-start md:self-auto shadow-inner">
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
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Presets, Priority & Tag Popover Picker */}
      <div className="flex flex-wrap gap-3 items-center justify-between pt-3 border-t border-border/50">
        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick:
          </span>

          <button
            onClick={() => handleQuickPreset("overdue")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
              filters.quickPreset === "overdue"
                ? "bg-destructive/20 text-destructive border-destructive/50 font-semibold"
                : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            ⚠️ Overdue
          </button>

          <button
            onClick={() => handleQuickPreset("today")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
              filters.quickPreset === "today"
                ? "bg-amber-500/20 text-amber-500 border-amber-500/50 font-semibold"
                : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            📅 Due Today
          </button>

          <button
            onClick={() => handleQuickPreset("tomorrow")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
              filters.quickPreset === "tomorrow"
                ? "bg-blue-500/20 text-blue-500 border-blue-500/50 font-semibold"
                : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            ⏳ Due Tomorrow
          </button>

          <button
            onClick={() => handleQuickPreset("high_priority")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
              filters.quickPreset === "high_priority"
                ? "bg-purple-500/20 text-purple-400 border-purple-500/50 font-semibold"
                : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            🔥 High Priority
          </button>
        </div>

        {/* Priority & Tag Popover */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority selector */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
            <span className="text-xs font-medium text-muted-foreground px-1.5">Priority:</span>
            {(["all", "high", "medium", "low"] as const).map((pOption) => {
              const isSelected = filters.priority === pOption;
              return (
                <button
                  key={pOption}
                  onClick={() => onFilterChange({ priority: pOption })}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer capitalize ${
                    isSelected
                      ? "bg-primary/20 text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {pOption}
                </button>
              );
            })}
          </div>

          {/* Clean Tag Popover Selector */}
          {availableTags.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 border-border/70 text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
                    filters.selectedTags.length > 0
                      ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>Tags</span>
                  {filters.selectedTags.length > 0 ? (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-primary text-primary-foreground font-bold">
                      {filters.selectedTags.length}
                    </Badge>
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-3 space-y-2">
                <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                  <span>Filter by Tags</span>
                  {filters.selectedTags.length > 0 && (
                    <button
                      onClick={() => onFilterChange({ selectedTags: [] })}
                      className="text-[11px] text-destructive hover:underline cursor-pointer"
                    >
                      Clear tags
                    </button>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="Search tags..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="h-7 text-xs bg-muted/50"
                />
                <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                  {filteredAvailableTags.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No tags found</p>
                  ) : (
                    filteredAvailableTags.map((tag) => {
                      const isSelected = filters.selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-primary/15 text-primary font-semibold"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <span className="truncate">#{tag}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Row 3: Active Filter Chips Bar (Shown ONLY when filters are active) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-primary" />
              Active Filters:
            </span>

            {/* Quick Preset Chip */}
            {filters.quickPreset && (
              <Badge
                variant="secondary"
                className="h-6 px-2 text-xs gap-1 border border-amber-500/40 bg-amber-500/10 text-amber-500 cursor-pointer font-medium"
                onClick={() => onFilterChange({ quickPreset: null })}
              >
                Preset: {filters.quickPreset}
                <X className="w-3 h-3 hover:text-foreground" />
              </Badge>
            )}

            {/* Priority Chip */}
            {filters.priority !== "all" && (
              <Badge
                variant="secondary"
                className="h-6 px-2 text-xs gap-1 border border-primary/40 bg-primary/10 text-primary cursor-pointer font-medium capitalize"
                onClick={() => onFilterChange({ priority: "all" })}
              >
                Priority: {filters.priority}
                <X className="w-3 h-3 hover:text-foreground" />
              </Badge>
            )}

            {/* Selected Tag Chips */}
            {filters.selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="h-6 px-2 text-xs gap-1 border border-border bg-muted text-foreground cursor-pointer font-medium"
                onClick={() => toggleTag(tag)}
              >
                #{tag}
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </Badge>
            ))}

            {/* Search Chip */}
            {filters.search.trim() && (
              <Badge
                variant="secondary"
                className="h-6 px-2 text-xs gap-1 border border-border bg-muted text-foreground cursor-pointer font-medium max-w-xs truncate"
                onClick={() => onFilterChange({ search: "" })}
              >
                Search: &quot;{filters.search}&quot;
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredCount}</span> of {totalCount} tasks
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-1 font-medium"
            >
              <X className="w-3 h-3" />
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
