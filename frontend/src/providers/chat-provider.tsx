"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { chatApi, ChatMessage, Conversation } from "@/lib/chat-api";

interface ChatContextValue {
  conversations: Conversation[];
  messages: ChatMessage[];
  activeId: string | null;
  isLoading: boolean;
  isSending: boolean;
  isFetchingHistory: boolean;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  newChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * ChatProvider - Single source of truth for chat state.
 * Mounted in the dashboard layout so it survives route navigation.
 * Fetches conversations + last history once per dashboard session and
 * caches per-conversation messages in memory, so toggling to the chat
 * page never refetches. Optimistic updates keep the sidebar in sync.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [cache, setCache] = useState<Record<string, ChatMessage[]>>({});
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    async function init() {
      try {
        const data = await chatApi.getConversations();
        const convs = data.conversations || [];
        setConversations(convs);
        if (convs.length > 0) {
          const latest = convs[0];
          setActiveId(latest.id);
          const history = await chatApi.getHistory(latest.id);
          const msgs = history.messages || [];
          setMessages(msgs);
          setCache((prev) => ({ ...prev, [latest.id]: msgs }));
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const selectConversation = useCallback(
    async (id: string) => {
      if (id === activeId) return;
      setActiveId(id);
      if (cache[id]) {
        setMessages(cache[id]);
        return;
      }
      setIsFetchingHistory(true);
      try {
        const history = await chatApi.getHistory(id);
        const msgs = history.messages || [];
        setMessages(msgs);
        setCache((prev) => ({ ...prev, [id]: msgs }));
      } catch (error) {
        console.error(`Failed to load history for ${id}:`, error);
        setMessages([]);
      } finally {
        setIsFetchingHistory(false);
      }
    },
    [activeId, cache],
  );

  const newChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;

      const userMessage = text.trim();
      const isNewThread = !activeId;
      const tempId = isNewThread ? `temp-${Date.now()}` : null;

      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      if (isNewThread) {
        setConversations((prev) => [
          {
            id: tempId!,
            created_at: new Date(),
            updated_at: new Date(),
            message_count: 1,
            first_message_preview: userMessage,
          },
          ...prev,
        ]);
      } else {
        setConversations((prev) => {
          const now = new Date();
          const existing = prev.find((c) => c.id === activeId);
          const updated: Conversation = {
            id: activeId,
            created_at: existing?.created_at ?? now,
            updated_at: now,
            message_count: (existing?.message_count ?? 0) + 1,
            first_message_preview:
              existing?.first_message_preview ?? userMessage,
          };
          return [updated, ...prev.filter((c) => c.id !== activeId)];
        });
      }

      setIsSending(true);
      try {
        const result = await chatApi.sendMessage(userMessage, activeId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.response },
        ]);

        if (isNewThread && tempId) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === tempId ? { ...c, id: result.conversation_id } : c,
            ),
          );
        }
        setActiveId(result.conversation_id);
      } catch (error) {
        console.error("Chat Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I encountered an error communicating with the server.",
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [activeId, isSending],
  );

  const value = {
    conversations,
    messages,
    activeId,
    isLoading,
    isSending,
    isFetchingHistory,
    selectConversation,
    sendMessage,
    newChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
