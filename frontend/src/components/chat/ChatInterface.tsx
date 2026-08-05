"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChatHeader } from "./ChatHeader";
import { ChatSidebar } from "./ChatSidebar";
import { useChatContext } from "@/providers/chat-provider";

export function ChatInterface() {
  const {
    conversations,
    messages,
    activeId,
    isLoading,
    isSending,
    isFetchingHistory,
    selectConversation,
    sendMessage,
    newChat,
  } = useChatContext();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, isFetchingHistory]);

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const handleNewChat = () => {
    newChat();
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSelectChat = (id: string) => {
    selectConversation(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-background rounded-lg border shadow-sm mx-auto max-w-4xl overflow-hidden mt-4 mb-8"
      style={{ height: "calc(100vh - 100px)" }}
    >
      <ChatHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          activeId={activeId}
          isLoading={isLoading}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />

        {/* Right Side: Flex Column keeps input pinned to bottom */}
        <div className="flex-1 flex flex-col bg-background">
          {/* Messages Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>Loading conversations...</p>
              </div>
            ) : isFetchingHistory ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>Loading history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                <Bot className="w-16 h-16" />
                <p className="max-w-md text-center">
                  Hello! I&apos;m your AI Todo assistant. Ask me to add a task,
                  show your pending items, or mark something as complete.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}

                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[80%] whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm border"
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="px-5 py-4 rounded-2xl bg-muted rounded-bl-sm border flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area (Fixed at Bottom) */}
          <div className="p-2 bg-card border-t shrink-0">
            <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to create a task..."
                className="w-full min-h-[56px] max-h-32 resize-none bg-background rounded-xl border p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-sm"
                rows={1}
                disabled={isSending}
              />
              <Button
                size="icon"
                className="absolute right-2 bottom-2 rounded-lg"
                onClick={handleSend}
                disabled={!input.trim() || isSending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-1">
              AI agents can make mistakes. Always verify your task changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}