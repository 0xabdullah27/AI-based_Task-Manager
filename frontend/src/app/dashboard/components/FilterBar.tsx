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
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-md p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Row 1: Search Bar & Main Views (Clean Split & Perfectly Aligned Vertically) */}
      <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks by title..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10 pr-9 h-10 bg-muted/40 border-border/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition rounded-lg text-sm placeholder:text-muted-foreground/60"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Main View Toggle Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 self-start sm:self-auto shadow-inner h-10 shrink-0">
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
                className={`px-4 h-full flex items-center justify-center rounded-md text-xs font-semibold transition-all cursor-pointer select-none ${
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

      {/* Row 2: Standardize Refinements (Quick Filters, Priority, Tags) */}
      <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-border/50 overflow-x-auto scrollbar-none py-0.5 flex-nowrap">
        {/* Quick Presets matching family outline buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground/70 mr-0.5 flex items-center gap-1 shrink-0 select-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick:
          </span>

          <button
            type="button"
            onClick={() => handleQuickPreset("overdue")}
            className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
              filters.quickPreset === "overdue"
                ? "border-primary/40 bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/80"
            }`}
          >
            ⚠️ Overdue
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset("today")}
            className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
              filters.quickPreset === "today"
                ? "border-primary/40 bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/80"
            }`}
          >
            📅 Due Today
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset("tomorrow")}
            className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
              filters.quickPreset === "tomorrow"
                ? "border-primary/40 bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/80"
            }`}
          >
            ⏳ Due Tomorrow
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset("high_priority")}
            className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
              filters.quickPreset === "high_priority"
                ? "border-primary/40 bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/80"
            }`}
          >
            🔥 High Priority
          </button>
        </div>

        {/* Priority & Tag Popover Dropdown Pills */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Priority Popover Dropdown Pill */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                  filters.priority !== "all"
                    ? "border-primary/40 bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/80"
                }`}
              >
                <span>Priority: <span className="capitalize">{filters.priority}</span></span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1.5 space-y-1">
              {(["all", "high", "medium", "low"] as const).map((pOption) => (
                <button
                  key={pOption}
                  onClick={() => onFilterChange({ priority: pOption })}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer capitalize flex items-center justify-between ${
                    filters.priority === pOption
                      ? "bg-primary/15 text-primary font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{pOption}</span>
                  {filters.priority === pOption && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Clean Tag Popover Dropdown Pill with Neutral Badge */}
          {availableTags.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                    filters.selectedTags.length > 0
                      ? "border-primary/40 bg-primary/10 text-primary font-semibold shadow-xs"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/80"
                  }`}
                >
                  <TagIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Tags</span>
                  {filters.selectedTags.length > 0 ? (
                    <span className="h-4 px-1.5 text-[10px] bg-muted-foreground/20 text-muted-foreground font-semibold rounded-full flex items-center justify-center ml-0.5">
                      {filters.selectedTags.length}
                    </span>
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
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

      {/* Row 3: Clean Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground/80 flex items-center gap-1 mr-1 select-none">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              Active Filters:
            </span>

            {/* Quick Preset Chip */}
            {filters.quickPreset && (
              <Badge
                variant="secondary"
                className="h-6 px-2.5 text-xs gap-1.5 border border-border/80 bg-muted/60 text-foreground rounded-full cursor-pointer font-medium hover:bg-muted transition"
                onClick={() => onFilterChange({ quickPreset: null })}
              >
                Preset: {filters.quickPreset === "high_priority" ? "high priority" : filters.quickPreset}
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </Badge>
            )}

            {/* Priority Chip */}
            {filters.priority !== "all" && (
              <Badge
                variant="secondary"
                className="h-6 px-2.5 text-xs gap-1.5 border border-border/80 bg-muted/60 text-foreground rounded-full cursor-pointer font-medium capitalize hover:bg-muted transition"
                onClick={() => onFilterChange({ priority: "all" })}
              >
                Priority: {filters.priority}
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </Badge>
            )}

            {/* Selected Tag Chips */}
            {filters.selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="h-6 px-2.5 text-xs gap-1.5 border border-border/80 bg-muted/60 text-foreground rounded-full cursor-pointer font-medium hover:bg-muted transition"
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
                className="h-6 px-2.5 text-xs gap-1.5 border border-border/80 bg-muted/60 text-foreground rounded-full cursor-pointer font-medium max-w-xs truncate hover:bg-muted transition"
                onClick={() => onFilterChange({ search: "" })}
              >
                Search: &quot;{filters.search}&quot;
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3.5 ml-auto shrink-0">
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredCount}</span> of {totalCount} tasks
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-1 font-medium transition"
            >
              <X className="w-3.5 h-3.5" />
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
