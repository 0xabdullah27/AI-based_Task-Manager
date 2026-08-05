"use client";

import { Bot, Menu, Plus } from "lucide-react";
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
    <header className="border-b bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h2 className="font-semibold text-lg">
                Todo Assistant
              </h2>

              <p className="text-sm text-muted-foreground">
                Manage your tasks using natural language
              </p>
            </div>
          </div>
        </div>

        {/* Right */}
        <Button
          variant="outline"
          className="gap-2"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">
            New Chat
          </span>
        </Button>
      </div>
    </header>
  );
}