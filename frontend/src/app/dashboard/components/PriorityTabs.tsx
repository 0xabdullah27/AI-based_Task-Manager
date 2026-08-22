"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Todo } from "@/types/task";

interface PriorityTabsProps {
  todos: Todo[] | undefined;
  isLoading: boolean;
  renderContent: (
    todos: Todo[],
    priority: "high" | "medium" | "low"
  ) => React.ReactNode;
}

export function PriorityTabs({
  todos = [],
  isLoading,
  renderContent,
}: PriorityTabsProps) {
  // Display all priority levels in sort order (high → medium → low)
  const priorities = ["high", "medium", "low"] as const;

  const getCounts = () => {
    return Object.fromEntries(
      priorities.map((p) => [
        p,
        todos?.filter((t) => t.priority === p).length || 0,
      ])
    );
  };

  const counts = getCounts();

  return (
    <Tabs defaultValue="high" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        {priorities.map((priority) => (
          <TabsTrigger key={priority} value={priority} className="relative">
            <div className="flex items-center gap-2">
              <span className="capitalize">{priority}</span>
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {counts[priority] || 0}
              </Badge>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>

      {priorities.map((priority) => (
        <TabsContent key={priority} value={priority} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            renderContent(
              todos?.filter((t) => t.priority === priority) || [],
              priority
            )
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
