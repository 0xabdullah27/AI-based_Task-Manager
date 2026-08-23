/**
 * SortSelector component - Sort options
 * Spec: 002-todo-organization-features
 * Task: T102
 */

import { SortField } from "@/types/task";
import { SORT_LABELS } from "@/lib/validations/task";

interface SortSelectorProps {
  value: SortField;
  onChange: (value: SortField) => void;
}

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-foreground">
        Sort by
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortField)}
        className="w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-primary transition"
      >
        <option value="priority" className="bg-card text-foreground">{SORT_LABELS.priority}</option>
        <option value="title" className="bg-card text-foreground">{SORT_LABELS.title}</option>
        <option value="created_at" className="bg-card text-foreground">{SORT_LABELS.created_at}</option>
      </select>
    </div>
  );
}
