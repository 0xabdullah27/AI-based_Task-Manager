"use client";

import { Menu, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  onNewChat?: () => void;
}

export function ChatHeader({
  onToggleSidebar,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background px-4 py-3 shrink-0">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            className="p-1.5 -ml-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors cursor-pointer"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-2">
             <Sparkles className="w-4 h-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
             <h2 className="font-semibold text-[15px] text-foreground">
               Todo Assistant
             </h2>
          </div>
        </div>

        {/* Right */}
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1.5 rounded-md hover:bg-muted/50"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">New chat</span>
        </button>
      </div>
    </header>
  );
}