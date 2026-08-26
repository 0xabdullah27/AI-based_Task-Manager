import { getJwtToken } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StreamCallbacks {
  /** Called with each text token as it arrives */
  onToken: (token: string) => void;
  /** Called once streaming is fully complete */
  onDone: (conversationId: string, fullResponse: string) => void;
  /** Called if an error event arrives or the fetch itself fails */
  onError: (errorContent: string) => void;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponsePayload {
  conversation_id: string;
  response: string;
  tool_calls: unknown[];
}

export interface ChatHistoryResponsePayload {
  conversation_id: string | null;
  messages: ChatMessage[];
}

// Added interface for the Sidebar conversations
export interface Conversation {
  id: string;
  created_at: Date;
  updated_at: Date | null;
  message_count: number;
  first_message_preview: string | null;
}

export interface ConversationsResponsePayload {
  conversations: Conversation[];
}

export const chatApi = {
  /**
   * Send a standard, non-streaming chat message to the FastAPI backend.
   */
  async sendMessage(
    message: string,
    conversation_id: string | null = null,
  ): Promise<ChatResponsePayload> {
    const token = getJwtToken();

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        conversation_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat API error (${response.status}): ${errorText}`);
    }

    return response.json();
  },

  /**
   * Stream the AI response via Server-Sent Events (SSE).
   * Connects to POST /api/chat/stream and fires callbacks for each token.
   * Returns an AbortController so the caller can cancel mid-stream.
   */
  sendMessageStream(
    message: string,
    conversation_id: string | null = null,
    callbacks: StreamCallbacks,
  ): AbortController {
    const controller = new AbortController();
    const token = getJwtToken();

    (async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message, conversation_id }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text().catch(() => response.statusText);
          callbacks.onError(`Stream connection failed (${response.status}): ${errorText}`);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";

        const processLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) return;

          const raw = trimmed.slice(5).trim();
          if (!raw || raw === "[DONE]") return;

          try {
            const parsed = JSON.parse(raw) as {
              type: "token" | "error" | "done";
              content?: string;
              conversation_id?: string;
              response?: string;
            };

            if (parsed.type === "token" && parsed.content) {
              fullResponse += parsed.content;
              callbacks.onToken(parsed.content);
            } else if (parsed.type === "error" && parsed.content) {
              callbacks.onError(parsed.content);
            } else if (parsed.type === "done") {
              callbacks.onDone(
                parsed.conversation_id ?? "",
                parsed.response ?? fullResponse,
              );
            }
          } catch {
            // Non-JSON line — ignore
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            processLine(line);
          }
        }

        if (buffer.trim()) {
          processLine(buffer);
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name === "AbortError") return;
        callbacks.onError(
          err instanceof Error ? err.message : "Unknown streaming error",
        );
      }
    })();

    return controller;
  },

  /**
   * Fetch all past conversations for the sidebar.
   */
  async getConversations(
    authToken?: string,
  ): Promise<ConversationsResponsePayload> {
    let token;
    if (authToken) {
      token = authToken;
    } else {
      token = getJwtToken();
    }

    const response = await fetch(`${BACKEND_URL}/api/conversations`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Conversations API error (${response.status}): ${errorText}`,
      );
    }

    return response.json();
  },

  /**
   * Fetch the conversation history for a specific chat ID.
   */
  async getHistory(
    conversation_id: string,
    authToken?: string,
  ): Promise<ChatHistoryResponsePayload> {
    let token;
    if (authToken) {
      token = authToken;
    } else {
      token = getJwtToken();
    }

    const response = await fetch(
      `${BACKEND_URL}/api/chat/history/${conversation_id}`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Chat History API error (${response.status}): ${errorText}`,
      );
    }

    return response.json();
  },

  async getLastMessagesHistory(
    authToken?: string,
  ): Promise<ChatHistoryResponsePayload> {
    let token;
    if (authToken) {
      token = authToken;
    } else {
      token = getJwtToken();
    }

    const response = await fetch(
      `${BACKEND_URL}/api/chat/history`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Chat History API error (${response.status}): ${errorText}`,
      );
    }

    return response.json();
  },
};
