"""Pydantic schemas for Chat API requests/responses (per spec)."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ChatRequest(BaseModel):
    """Chat request schema.

    Per spec:
    - conversation_id: optional (creates new if not provided)
    - message: required (user's natural language message, max 5000 chars)
    """
    conversation_id: Optional[str] = Field(
        default=None,
        description="Existing conversation ID (creates new if not provided)"
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="User's natural language message (max 5000 characters)"
    )


class ToolCallInfo(BaseModel):
    """Info about an MCP tool that was invoked."""
    tool_name: str
    arguments: dict = Field(default_factory=dict)
    result: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response schema.

    Per spec:
    - conversation_id: the conversation ID
    - response: AI assistant's response
    - tool_calls: list of MCP tools invoked
    """
    conversation_id: str = Field(description="The conversation ID")
    response: str = Field(description="AI assistant's response")
    # tool_calls: list[ToolCallInfo] = Field(
    #     default_factory=list,
    #     description="List of MCP tools invoked"
    # )


class ChatMessageSchema(BaseModel):
    """A single chat message in the history."""
    role: str
    content: str


class ChatHistoryResponse(BaseModel):
    """Response containing conversation history for the frontend."""
    conversation_id: Optional[str] = Field(description="The conversation ID, or None if no previous conversation")
    messages: list[ChatMessageSchema] = Field(description="List of messages in the conversation")


class ConversationSummary(BaseModel):
    """Summary of a conversation for list view."""
    id: str = Field(description="Conversation UUID")
    created_at: datetime = Field(description="When conversation was created")
    updated_at: Optional[datetime] = Field(description="Last message time")
    message_count: int = Field(description="Number of messages in conversation")
    first_message_preview: Optional[str] = Field(
        default=None,
        description="First message content (preview)"
    )


class ConversationListResponse(BaseModel):
    """Response for listing conversations."""
    conversations: List[ConversationSummary] = Field(description="List of conversation summaries")
    total: int = Field(description="Total number of conversations")
