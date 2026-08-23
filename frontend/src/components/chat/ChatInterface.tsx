"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, User, Bot, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChatHeader } from "./ChatHeader";
import { ChatSidebar } from "./ChatSidebar";
import { useChatContext } from "@/providers/chat-provider";
import { ChatMessageContent } from "./ChatMessageContent";

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
      className="flex flex-col h-full bg-background mx-auto max-w-5xl overflow-hidden border-x border-border/50"
      style={{ height: "calc(100vh - 56px)" }} // Assuming 56px is the top nav height
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
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm">Loading conversations...</p>
              </div>
            ) : isFetchingHistory ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm">Loading history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/70 space-y-4">
                <Sparkles className="w-12 h-12 opacity-80" strokeWidth={1.5} />
                <p className="max-w-md text-center text-sm">
                  Hello! I'm your AI Todo assistant. Ask me to add a task,
                  show your pending items, or mark something as complete.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                     <Sparkles className="w-5 h-5 mt-1 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  )}

                  <div
                    className={`text-[15px] leading-relaxed max-w-[85%] ${
                      m.role === "user"
                        ? "bg-muted/50 px-4 py-3 rounded-xl rounded-br-sm border border-border/50 text-foreground"
                        : "text-foreground"
                    }`}
                  >
                    <ChatMessageContent content={m.content} role={m.role} />
                  </div>

                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-muted/80 border border-border/50 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="flex gap-4 justify-start">
                <Sparkles className="w-5 h-5 mt-1 shrink-0 animate-pulse text-muted-foreground" strokeWidth={1.5} />
                <div className="flex items-center gap-2 h-8">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area (Fixed at Bottom) */}
          <div className="p-4 sm:px-8 shrink-0 bg-background">
            <div className="relative max-w-4xl mx-auto rounded-xl border border-border/60 bg-muted/20 focus-within:bg-background focus-within:border-border focus-within:ring-1 focus-within:ring-border transition-all shadow-sm">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to manage your tasks..."
                className="w-full min-h-[56px] max-h-40 resize-none bg-transparent p-4 pr-12 focus:outline-none text-[15px]"
                rows={1}
                disabled={isSending}
              />
              <button
                className={`absolute right-3 bottom-3 p-1.5 rounded-md transition-colors ${
                  !input.trim() || isSending 
                    ? "text-muted-foreground/40 cursor-not-allowed" 
                    : "bg-foreground text-background hover:bg-foreground/90 cursor-pointer shadow-xs"
                }`}
                onClick={handleSend}
                disabled={!input.trim() || isSending}
              >
                <Send className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <p className="text-[11px] text-center text-muted-foreground/70 mt-3 font-medium">
              AI can make mistakes. Please verify important task changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}