"""Chat API endpoint for AI-powered todo management.

Per spec: POST /api/chat — sends message & gets AI response.
The endpoint is authenticated via JWT, conversation state is persisted to DB.
"""
import logging
import json

from fastapi import APIRouter, status, Query, HTTPException, Request
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from src.api.deps import CurrentUser, DbSession
from src.schemas.chat import (
    ChatRequest, 
    ChatResponse, 
    ChatHistoryResponse,
    ConversationListResponse,
)
from src.services.agent.agent_service import handle_chat, handle_chat_stream
from src.middleware.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])

# main chat endpoint takes(message, optional conversation_id) and returns (conversation_id, response)
@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    user_id: CurrentUser,
    session: DbSession,
):
    """Send a message and get an AI response.

    Per spec stateless flow:
    1. Receives user message
    2. Fetches conversation history from database
    3. Runs agent with MCP tools
    4. Stores messages in database
    5. Returns response (server holds NO state)

    Request:
        - message: User's natural language message (required, max 5000 chars)
        - conversation_id: Existing conversation ID (optional, creates new if not provided)

    Response:
        - conversation_id: The conversation ID
        - response: AI assistant's response
        - tool_calls: List of MCP tools invoked
    
    Rate Limit: 20 requests per minute
    """
    logger.info(f"Chat request from user {user_id}: {chat_request.message[:50]}...")

    response = await handle_chat(
        user_id=user_id,
        message=chat_request.message,
        conversation_id=chat_request.conversation_id,
        session=session,
    )

    return response


@router.post("/chat/stream")
@limiter.limit("10/minute")
async def chat_stream(
    request: Request,
    chat_request: ChatRequest,
    user_id: CurrentUser,
    session: DbSession,
):
    """Send a message and get a streaming AI response via SSE.

    Per spec stateless flow with streaming:
    1. Receives user message
    2. Fetches conversation history from database
    3. Runs agent with MCP tools
    4. Streams response tokens as they arrive (word-by-word)
    5. Stores messages in database
    6. Returns SSE stream (server holds NO state)

    Request:
        - message: User's natural language message (required, max 5000 chars)
        - conversation_id: Existing conversation ID (optional, creates new if not provided)

    Response (SSE Stream):
        - Events: {"type": "token", "content": "..."} for each word
        - Events: {"type": "error", "content": "..."} on error
        - Final: {"type": "done", "conversation_id": "...", "response": "..."}

    Frontend usage:
        const eventSource = new EventSource('/api/chat/stream');
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'token') {
                // Append token to UI
            } else if (data.type === 'done') {
                // Conversation complete
            }
        };
    
    Rate Limit: 10 requests per minute
    """
    logger.info(f"Streaming chat request from user {user_id}: {chat_request.message[:50]}...")

    # Create an async generator for SSE streaming
    async def event_generator():
        async for chunk in handle_chat_stream(
            user_id=user_id,
            message=chat_request.message,
            conversation_id=chat_request.conversation_id,
            session=session,
        ):
            yield chunk

    # Return SSE stream
    return EventSourceResponse(event_generator()) 
    #this "EventSourceResponse()" actually make this endpoint sse that can send the responce in junks

# Get latest conversation (chat history)
@router.get("/chat/history", response_model=ChatHistoryResponse, status_code=status.HTTP_200_OK)
async def get_history(
    user_id: CurrentUser,
    session: DbSession,
):
    """Get the most recent conversation and its messages.

    Used by the frontend to resume a session when the page reloads.
    """
    from src.services.conversation_service import conversation_service

    logger.info(f"Fetching chat history for user {user_id}")
    history_data = conversation_service.get_latest_conversation_history(session, user_id)

    return history_data

# Get the specific conversation (chat history) using conversation_id. 
@router.get("/chat/history/{conversation_id}", response_model=ChatHistoryResponse, status_code=status.HTTP_200_OK)
async def get_conversation_history(
    conversation_id: str,
    user_id: CurrentUser,
    session: DbSession,
    limit: int = Query(default=50, ge=1, le=100),
):
    """Get history for a specific conversation.
    
    Use this to load a specific conversation's messages,
    not just the most recent one.
    
    Path Parameters:
        - conversation_id: The conversation UUID to load
    
    Query Parameters:
        - limit: Number of messages to fetch (default: 50, max: 100)
    
    Returns:
        - conversation_id: The conversation ID
        - messages: List of messages in the conversation
    """
    from src.services.conversation_service import conversation_service
    
    # Verify user owns this conversation
    conversation = conversation_service._repo.get_conversation(
        session, conversation_id, user_id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found or you don't have access"
        )
    
    messages = conversation_service.get_history(session, conversation_id, limit)
    
    return ChatHistoryResponse(
        conversation_id=conversation_id,
        messages=messages
    )

# Get all conversations
@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    user_id: CurrentUser,
    session: DbSession,
    limit: int = Query(default=50, ge=1, le=100),
):
    """List all conversations for the authenticated user.
    
    This endpoint returns a list of all conversations with metadata,
    allowing users to choose which conversation to continue.
    
    Query Parameters:
        - limit: Maximum number of conversations to return (default: 50, max: 100)
    
    Returns:
        - conversations: List of conversation summaries with:
            - id: Conversation UUID
            - created_at: When conversation was created
            - updated_at: Last message time
            - message_count: Total messages in conversation
            - first_message_preview: First message content (for preview)
        - total: Total number of conversations
    """
    from src.services.conversation_service import conversation_service
    
    logger.info(f"Listing conversations for user {user_id}")
    conversations = conversation_service.list_conversations(session, user_id, limit)
    
    return ConversationListResponse(
        conversations=conversations,
        total=len(conversations)
    )
