"use client";

import { MessageSquare, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Conversation } from "@/lib/chat-api";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  isOpen,
  onClose,
  conversations,
  activeId,
  isLoading,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps) {
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`
          fixed lg:relative
          top-0 left-0
          h-full
          bg-background/80 backdrop-blur-xl
          z-50
          flex
          flex-col
          overflow-hidden 
          transition-all 
          duration-300
          whitespace-nowrap
          border-r border-border/50
          ${isOpen
            ? "translate-x-0 w-[260px]"
            : "-translate-x-full w-[260px] lg:translate-x-0 lg:w-0 lg:border-r-0"
          }
        `}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-3 shrink-0">
          <h2 className="font-medium text-sm text-muted-foreground ml-1">Previous Chats</h2>
          <button
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground lg:hidden cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {isLoading ? (
            <div className="text-[13px] text-muted-foreground/70 px-2 py-2">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-[13px] text-muted-foreground/70 px-2 py-2">
              No previous chats
            </div>
          ) : (
            conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  w-full rounded-md px-2.5 py-3 text-left transition-colors flex items-center gap-2 cursor-pointer group
                  ${activeId === chat.id
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <MessageSquare
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${activeId === chat.id
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  strokeWidth={1.5}
                />
                <span className="font-medium truncate text-[13px] flex-1">
                  {chat.first_message_preview || "New Conversation"}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}