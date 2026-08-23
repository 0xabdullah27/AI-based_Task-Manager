"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TaskGroup } from "@/lib/date-utils";
import type { Todo } from "@/types/task";

interface TaskGroupSectionProps {
  group: TaskGroup;
  renderTask: (task: Todo) => React.ReactNode;
  defaultExpanded?: boolean;
}

export function TaskGroupSection({
  group,
  renderTask,
  defaultExpanded = true,
}: TaskGroupSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (group.tasks.length === 0) return null;

  return (
    <div className={`rounded-xl border ${group.borderClass} overflow-hidden shadow-xs transition-all`}>
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`w-full flex items-center justify-between px-4 py-3 ${group.headerBgClass} hover:opacity-90 transition cursor-pointer select-none`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{group.icon}</span>
          <h2 className="font-bold text-foreground text-base flex items-center gap-2">
            {group.title}
            <Badge className={`border ${group.badgeClass} font-semibold px-2 text-xs`}>
              {group.tasks.length}
            </Badge>
          </h2>
          <span className="hidden sm:inline-block text-xs text-muted-foreground ml-2 border-l border-border/50 pl-3">
            {group.description}
          </span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <span className="text-xs font-medium mr-1">
            {isExpanded ? "Collapse" : "Expand"}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Task Cards Container */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-card/60">
          {group.tasks.map((task) => (
            <div key={task.id}>{renderTask(task)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
