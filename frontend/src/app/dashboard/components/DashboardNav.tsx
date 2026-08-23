"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DashboardNavProps {
  onMenuToggle: () => void;
}

export function DashboardNav({ onMenuToggle }: DashboardNavProps) {
  return (
    // Mobile-only navigation bar for opening sidebar drawer
    <nav
      className="md:hidden sticky top-0 z-40 border-b px-4 h-14 flex items-center justify-between transition bg-background border-border"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="p-1.5 h-9 w-9 text-foreground"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <span className="font-bold text-sm text-foreground">TaskHub</span>
      </div>
    </nav>
  );
}
