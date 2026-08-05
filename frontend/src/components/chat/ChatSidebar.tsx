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
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed lg:relative
          top-0 left-0
          h-full
          bg-card
          z-50
          flex
          flex-col
          overflow-hidden 
          transition-all 
          duration-300
          whitespace-nowrap
          ${
            isOpen
              ? "translate-x-0 w-72 border-r"
              : "-translate-x-full w-72 border-r lg:translate-x-0 lg:w-0 lg:border-r-0"
          }
        `}
      >
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-lg">Conversations</h2>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* New Chat */}
        <div className="p-3 border-b shrink-0">
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4 shrink-0" />
            New Chat
          </Button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center p-4">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">
              No previous chats
            </p>
          ) : (
            conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  if (window.innerWidth < 1024) onClose(); 
                }}
                className={`
                  w-full rounded-xl p-3 text-left transition-colors flex gap-3 items-start
                  ${
                    activeId === chat.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  }
                `}
              >
                <div className="mt-0.5 shrink-0">
                  <MessageSquare
                    className={`w-4 h-4 ${
                      activeId === chat.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>

                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate text-sm">
                    {chat.first_message_preview || "New Conversation"}
                  </p>

                  <p className="text-xs opacity-70 mt-1">
                    {formatDate(chat.updated_at || chat.created_at)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-3 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            {conversations.length} saved chats
          </p>
        </div>
      </aside>
    </>
  );
}