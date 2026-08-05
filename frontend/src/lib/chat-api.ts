import { getJwtToken } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export interface ChatStreamEvent {
  type: "token" | "error" | "done";
  content?: string;
  conversation_id?: string;
  response?: string;
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

/**
 * Parse a single SSE block into a chat stream event. The backend frames each
 * event as a single `data: {json}` line whose JSON may itself contain newlines
 * (multi-line responses), so the first line's `data:` prefix is stripped and
 * all continuation lines are re-joined verbatim. Returns null when the block
 * carries no parseable JSON payload.
 */
function parseSseEvent(rawEvent: string): ChatStreamEvent | null {
  const lines = rawEvent.split("\n");
  const dataIndex = lines.findIndex((line) => line.startsWith("data:"));
  if (dataIndex === -1) return null;

  const payload = [
    lines[dataIndex].slice(5).trimStart(),
    ...lines.slice(dataIndex + 1),
  ].join("\n");

  try {
    return JSON.parse(payload) as ChatStreamEvent;
  } catch {
    return null;
  }
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
   * Send a chat message and consume the streaming (SSE) response from
   * `POST /api/chat/stream`. Each `token` event is forwarded to `onToken`
   * so the UI can render tokens as they arrive. Resolves with the final
   * payload once the stream's `done` event is received.
   */
  async sendMessageStream(
    message: string,
    conversation_id: string | null,
    onToken: (token: string) => void,
  ): Promise<ChatResponsePayload> {
    const token = getJwtToken();

    const response = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        conversation_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Chat stream API error (${response.status}): ${errorText}`,
      );
    }

    if (!response.body) {
      throw new Error("Chat stream API error: response body is not readable");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const isDoneEvent = (
      event: ChatStreamEvent | null,
    ): event is ChatStreamEvent & { type: "done"; conversation_id: string } =>
      event !== null &&
      event.type === "done" &&
      typeof event.conversation_id === "string";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Normalize line endings so frames can be split on a blank line
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        // Greedy frame extraction: a "\n\n" inside a JSON payload is not a
        // frame boundary, so keep extending the candidate until it parses.
        let progressed = true;
        while (progressed) {
          progressed = false;
          let separatorIndex = buffer.indexOf("\n\n");

          while (separatorIndex !== -1) {
            const rawEvent = buffer.slice(0, separatorIndex);

            if (rawEvent.includes("data:")) {
              const event = parseSseEvent(rawEvent);
              if (event) {
                buffer = buffer.slice(separatorIndex + 2);
                if (isDoneEvent(event)) {
                  return {
                    conversation_id: event.conversation_id,
                    response: event.response ?? "",
                    tool_calls: [],
                  };
                }
                if (event.type === "token" && event.content) {
                  onToken(event.content);
                } else if (event.type === "error") {
                  throw new Error(event.content || "Chat stream error");
                }
                progressed = true;
                break;
              }
            }

            separatorIndex = buffer.indexOf("\n\n", separatorIndex + 2);
          }
        }
      }

      // Stream ended: try to parse any trailing bytes as the final event
      if (buffer.trim().length > 0) {
        const event = parseSseEvent(buffer.trim());
        if (isDoneEvent(event)) {
          return {
            conversation_id: event.conversation_id,
            response: event.response ?? "",
            tool_calls: [],
          };
        }
      }
    } finally {
      reader.releaseLock();
    }

    throw new Error("Chat stream ended without a done event");
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
