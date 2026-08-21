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
