/**
 * TagChip component - Clickable tag display
 * Spec: 002-todo-organization-features
 * Task: T054
 */

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagChipProps {
  name: string;
  onRemove?: () => void;  // Show X button if provided
  onClick?: () => void;   // Click to filter
  className?: string;
}

export function TagChip({ name, onRemove, onClick, className }: TagChipProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling if used in a clickable container
    if (onClick) {
      onClick();
    }
  };

  return (
    <span
      className={cn(
        "group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-border bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer",
        onClick && "hover:underline",
        className
      )}
      onClick={handleClick}
      aria-label={`Tag: ${name}${onRemove ? ", removable" : ""}`}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 focus:outline-none transition-colors opacity-70 hover:opacity-100 cursor-pointer"
          aria-label={`Remove tag ${name}`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
