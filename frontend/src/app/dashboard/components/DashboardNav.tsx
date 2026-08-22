"use client";

import { Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTasks } from "@/hooks/useTasks";

interface DashboardNavProps {
  onMenuToggle: () => void;
}

export function DashboardNav({ onMenuToggle }: DashboardNavProps) {
  const { fetchTasks, isLoading } = useTasks();

  const handleReload = () => {
    fetchTasks();
  };

  return (
    // T024: Use semantic theme variables for DashboardNav
    <nav
      className="sticky top-0 z-40 border-b px-4 md:px-8 h-16 flex items-center gap-4 transition"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Reload Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReload}
        disabled={isLoading}
        className="gap-2 hidden sm:flex"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        Reload todos
      </Button>
      
      {/* Mobile Reload Icon Only */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleReload}
        disabled={isLoading}
        className="sm:hidden"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </nav>
  );
}
