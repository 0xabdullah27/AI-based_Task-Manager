/**
 * SearchBar component - Search input with debounce
 * Spec: 002-todo-organization-features
 * Task: T067, T109
 */

import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const debouncedValue = useDebounce(value, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
        <Search className="h-5 w-5" aria-label="" />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search tasks..."
        className="block w-full pl-10 pr-10 py-2 border border-input bg-card text-foreground placeholder:text-muted-foreground rounded-md leading-5 focus:outline-none focus:ring-1 focus:ring-primary transition sm:text-sm shadow-xs"
      />
      {value && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground focus:outline-none transition cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
