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
import { useTasksContext } from "@/providers/tasks-provider";

interface ChatContextValue {
  conversations: Conversation[];
  messages: ChatMessage[];
  activeId: string | null;
  isLoading: boolean;
  isSending: boolean;
  isFetchingHistory: boolean;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (text: string) => void;
  newChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * ChatProvider - Single source of truth for chat state.
 * Mounted in the dashboard layout so it survives route navigation.
 * Fetches conversations + last history once per dashboard session and
 * caches per-conversation messages in memory, so toggling to the chat
 * page never refetches. Optimistic updates keep the sidebar in sync.
 *
 * Streaming: sendMessage uses the SSE /api/chat/stream endpoint.
 * Tokens are appended to the last assistant message slot as they arrive,
 * giving the user a real-time typing effect.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { fetchTasks } = useTasksContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [cache, setCache] = useState<Record<string, ChatMessage[]>>({});
  const didInitRef = useRef(false);
  const activeIdRef = useRef<string | null>(null);
  // Holds the AbortController for any in-flight stream so we can cancel on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Cancel any in-flight stream when the provider unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
    abortControllerRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setIsSending(false);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isSending) return;

      const userMessage = text.trim();
      const isNewThread = !activeId;
      const tempId = isNewThread ? `temp-${Date.now()}` : null;
      // Capture the conversation ID that was active when we started
      const startingConvId = activeId;

      // --- Optimistic UI: user message ---
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
            id: activeId!,
            created_at: existing?.created_at ?? now,
            updated_at: now,
            message_count: (existing?.message_count ?? 0) + 1,
            first_message_preview:
              existing?.first_message_preview ?? userMessage,
          };
          return [updated, ...prev.filter((c) => c.id !== activeId)];
        });
      }

      // --- Optimistic UI: empty assistant placeholder (will be filled by tokens) ---
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsSending(true);

      // Abort any existing stream before starting a new one
      abortControllerRef.current?.abort();

      const controller = chatApi.sendMessageStream(
        userMessage,
        startingConvId,
        {
          onToken(token) {
            // Only update if the user hasn't switched conversations mid-stream
            if (activeIdRef.current !== startingConvId && !isNewThread) return;
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (next[lastIdx]?.role === "assistant") {
                next[lastIdx] = {
                  ...next[lastIdx],
                  content: next[lastIdx].content + token,
                };
              }
              return next;
            });
          },

          onDone(conversationId, fullResponse) {
            setIsSending(false);

            // Ensure last message has the complete fullResponse
            if (activeIdRef.current === startingConvId || isNewThread) {
              setMessages((prev) => {
                const next = [...prev];
                const lastIdx = next.length - 1;
                if (next[lastIdx]?.role === "assistant") {
                  next[lastIdx] = {
                    ...next[lastIdx],
                    content: fullResponse || next[lastIdx].content,
                  };
                }
                return next;
              });
            }

            // Replace the temp sidebar entry with the real conversation ID
            if (isNewThread && tempId) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === tempId ? { ...c, id: conversationId } : c,
                ),
              );
            }
            setActiveId(conversationId);

            // Sync cache so navigating away and back doesn't lose messages
            setCache((prev) => {
              const key = startingConvId ?? conversationId;
              const currentHistory = prev[key] || [];
              const newHistory = [
                ...(currentHistory.length === 0 || !startingConvId
                  ? [{ role: "user" as const, content: userMessage }]
                  : []),
                { role: "assistant" as const, content: fullResponse },
              ];
              return {
                ...prev,
                [conversationId]: [...currentHistory, ...newHistory],
              };
            });

            // Refresh task list in case the agent created/updated/deleted any task
            fetchTasks().catch(console.error);
          },

          onError(errorContent) {
            setIsSending(false);
            // Only update visible messages if still on the same conversation
            if (activeIdRef.current === startingConvId || isNewThread) {
              setMessages((prev) => {
                const next = [...prev];
                const lastIdx = next.length - 1;
                if (next[lastIdx]?.role === "assistant") {
                  next[lastIdx] = {
                    ...next[lastIdx],
                    content: errorContent,
                  };
                } else {
                  next.push({ role: "assistant", content: errorContent });
                }
                return next;
              });
            }
          },
        },
      );

      abortControllerRef.current = controller;
    },
    [activeId, isSending, fetchTasks],
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
