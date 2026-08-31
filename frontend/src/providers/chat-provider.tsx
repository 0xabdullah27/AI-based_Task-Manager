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
  const [cache, setCache] = useState<Record<string, ChatMessage[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
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
        return;
      }
      setIsFetchingHistory(true);
      try {
        const history = await chatApi.getHistory(id);
        const msgs = history.messages || [];
        setCache((prev) => ({ ...prev, [id]: msgs }));
      } catch (error) {
        console.error(`Failed to load history for ${id}:`, error);
        setCache((prev) => ({ ...prev, [id]: [] }));
      } finally {
        setIsFetchingHistory(false);
      }
    },
    [activeId, cache],
  );

  const newChat = useCallback(() => {
    setActiveId(null);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isSending) return;

      const userMessage = text.trim();
      const currentActive = activeIdRef.current;
      const isNewThread = !currentActive || currentActive.startsWith("temp-");
      const threadKey = isNewThread
        ? (currentActive && currentActive.startsWith("temp-") ? currentActive : `temp-${Date.now()}`)
        : currentActive;

      // Optimistic UI: append user message + assistant placeholder to thread's cache
      setCache((prev) => {
        const existing = prev[threadKey] || [];
        return {
          ...prev,
          [threadKey]: [
            ...existing,
            { role: "user", content: userMessage },
            { role: "assistant", content: "" },
          ],
        };
      });

      // If this was a fresh new chat without a tempId yet, set activeId to threadKey
      if (isNewThread && activeIdRef.current !== threadKey) {
        setActiveId(threadKey);
      }

      // Update sidebar
      if (isNewThread) {
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === threadKey);
          if (exists) return prev;
          return [
            {
              id: threadKey,
              created_at: new Date(),
              updated_at: new Date(),
              message_count: 1,
              first_message_preview: userMessage,
            },
            ...prev,
          ];
        });
      } else {
        setConversations((prev) => {
          const now = new Date();
          const existing = prev.find((c) => c.id === threadKey);
          const updated: Conversation = {
            id: threadKey,
            created_at: existing?.created_at ?? now,
            updated_at: now,
            message_count: (existing?.message_count ?? 0) + 1,
            first_message_preview:
              existing?.first_message_preview ?? userMessage,
          };
          return [updated, ...prev.filter((c) => c.id !== threadKey)];
        });
      }

      setIsSending(true);

      // Abort any existing stream before starting a new one
      abortControllerRef.current?.abort();

      const backendConvId = isNewThread ? null : threadKey;

      const controller = chatApi.sendMessageStream(
        userMessage,
        backendConvId,
        {
          onToken(token) {
            // Append incoming tokens strictly into this specific thread's cache
            setCache((prev) => {
              const msgs = prev[threadKey];
              if (!msgs || msgs.length === 0) return prev;
              const next = [...msgs];
              const lastIdx = next.length - 1;
              if (next[lastIdx]?.role === "assistant") {
                next[lastIdx] = {
                  ...next[lastIdx],
                  content: next[lastIdx].content + token,
                };
              }
              return { ...prev, [threadKey]: next };
            });
          },

          onDone(conversationId, fullResponse) {
            setIsSending(false);
            abortControllerRef.current = null;

            // Ensure last message in cache has fullResponse and migrate tempId to real conversationId
            setCache((prev) => {
              const msgs = prev[threadKey] || [];
              const next = { ...prev };
              const updated = [...msgs];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx]?.role === "assistant") {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: fullResponse || updated[lastIdx].content,
                };
              }
              if (threadKey !== conversationId) {
                delete next[threadKey];
              }
              next[conversationId] = updated;
              return next;
            });

            // Replace temp ID in sidebar with real conversation ID
            if (threadKey !== conversationId) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === threadKey ? { ...c, id: conversationId } : c,
                ),
              );
            }

            // Only switch activeId if user is still viewing this thread
            if (activeIdRef.current === threadKey) {
              setActiveId(conversationId);
            }

            // Refresh task list in case the agent created/updated/deleted any task
            fetchTasks().catch(console.error);
          },

          onError(errorContent) {
            setIsSending(false);
            abortControllerRef.current = null;

            setCache((prev) => {
              const msgs = prev[threadKey] || [];
              const next = [...msgs];
              const lastIdx = next.length - 1;
              if (lastIdx >= 0 && next[lastIdx]?.role === "assistant") {
                next[lastIdx] = { ...next[lastIdx], content: errorContent };
              } else {
                next.push({ role: "assistant", content: errorContent });
              }
              return { ...prev, [threadKey]: next };
            });
          },
        },
      );

      abortControllerRef.current = controller;
    },
    [isSending, fetchTasks],
  );

  const messages = activeId ? (cache[activeId] || []) : [];

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
