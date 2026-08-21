"""Chat API router endpoints for AI-powered task management and conversation history.

This layer handles HTTP routing, rate limiting, request validation, SSE streaming setup,
and delegates all business logic and database interactions to the service layer.
"""
import logging
from typing import AsyncGenerator
from fastapi import APIRouter, status, Query, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from src.api.deps import CurrentUser, DbSession
from src.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ConversationListResponse,
)
from src.services.agent.agent_service import handle_chat, handle_chat_stream
from src.services.conversation_service import conversation_service
from src.middleware.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    user_id: CurrentUser,
    session: DbSession,
) -> ChatResponse:
    """Process a natural language user prompt and generate an AI assistant response.

    Args:
        request (Request): Raw FastAPI request instance (required by rate limiter).
        chat_request (ChatRequest): Validated request payload containing message and optional conversation_id.
        user_id (CurrentUser): Authenticated user ID dependency for user data isolation.
        session (DbSession): Active SQLModel database session dependency.

    Returns:
        ChatResponse: Response object containing conversation ID and generated AI answer string.
    """
    logger.info(f"Chat request from user {user_id}: {chat_request.message[:50]}...")

    return await handle_chat(
        user_id=user_id,
        message=chat_request.message,
        conversation_id=chat_request.conversation_id,
        session=session,
    )


@router.post("/chat/stream")
@limiter.limit("10/minute")
async def chat_stream(
    request: Request,
    chat_request: ChatRequest,
    user_id: CurrentUser,
    session: DbSession,
) -> EventSourceResponse:
    """Stream AI response tokens word-by-word via Server-Sent Events (SSE).

    Args:
        request (Request): Raw FastAPI request instance for rate limiting.
        chat_request (ChatRequest): Request schema with message and conversation_id.
        user_id (CurrentUser): Authenticated user ID.
        session (DbSession): Active database session.

    Returns:
        EventSourceResponse: SSE stream emitting token events and completion signal.
    """
    logger.info(f"Streaming chat request from user {user_id}: {chat_request.message[:50]}...")

    async def event_generator() -> AsyncGenerator[str, None]:
        async for chunk in handle_chat_stream(
            user_id=user_id,
            message=chat_request.message,
            conversation_id=chat_request.conversation_id,
            session=session,
        ):
            yield chunk

    return EventSourceResponse(event_generator(), media_type="text/plain")


@router.get("/chat/history", response_model=ChatHistoryResponse, status_code=status.HTTP_200_OK)
async def get_history(
    user_id: CurrentUser,
    session: DbSession,
) -> ChatHistoryResponse:
    """Retrieve the most recent conversation and its chat history for the authenticated user.

    Args:
        user_id (CurrentUser): Authenticated user ID dependency.
        session (DbSession): Active database session dependency.

    Returns:
        ChatHistoryResponse: Most recent conversation ID and list of message schemas.
    """
    logger.info(f"Fetching latest chat history for user {user_id}")
    return conversation_service.get_latest_conversation_history(session, user_id)


@router.get(
    "/chat/history/{conversation_id}",
    response_model=ChatHistoryResponse,
    status_code=status.HTTP_200_OK,
)
async def get_conversation_history(
    conversation_id: str,
    user_id: CurrentUser,
    session: DbSession,
    limit: int = Query(default=50, ge=1, le=100, description="Maximum messages to retrieve"),
) -> ChatHistoryResponse:
    """Retrieve chat message history for a specific conversation by ID.

    Args:
        conversation_id (str): Target conversation UUID path parameter.
        user_id (CurrentUser): Authenticated user ID dependency.
        session (DbSession): Active database session dependency.
        limit (int): Message pagination limit (1-100).

    Returns:
        ChatHistoryResponse: Conversation ID and list of message schemas.

    Raises:
        HTTPException: HTTP 404 NOT FOUND if conversation does not exist or user lacks access.
    """
    history = conversation_service.get_specific_conversation_history(
        session, conversation_id, user_id, limit=limit
    )
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found or access denied.",
        )
    return history


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    user_id: CurrentUser,
    session: DbSession,
    limit: int = Query(default=50, ge=1, le=100, description="Maximum conversations to retrieve"),
) -> ConversationListResponse:
    """List all chat conversations with metadata summaries for the authenticated user.

    Args:
        user_id (CurrentUser): Authenticated user ID dependency.
        session (DbSession): Active database session dependency.
        limit (int): Pagination limit (1-100).

    Returns:
        ConversationListResponse: List of conversation summaries and total conversation count.
    """
    logger.info(f"Listing conversations for user {user_id}")
    return conversation_service.list_conversations_response(session, user_id, limit=limit)
