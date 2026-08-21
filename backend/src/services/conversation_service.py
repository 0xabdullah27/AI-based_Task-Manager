"""Service layer managing business logic and workflows for chat conversations and message history."""
from sqlmodel import Session
from typing import List, Optional, Dict, Any

from src.models.conversation import Conversation
from src.models.message import Message
from src.schemas.chat import (
    ChatMessageSchema,
    ChatHistoryResponse,
    ConversationSummary,
    ConversationListResponse,
)
from src.repositories.conversation_repo import conversation_repo, ConversationRepository


class ConversationService:
    """Service class encapsulating business rules for chat sessions and message persistence."""

    def __init__(self, repo: ConversationRepository) -> None:
        """Initialize ConversationService with repository dependency.

        Args:
            repo (ConversationRepository): Data access repository instance.
        """
        self._repo = repo

    def get_conversation(
        self, session: Session, conversation_id: str, user_id: str
    ) -> Optional[Conversation]:
        """Fetch a conversation by ID scoped to the authenticated user.

        Args:
            session (Session): Active database session.
            conversation_id (str): Target conversation UUID string.
            user_id (str): Authenticated user ID for access verification.

        Returns:
            Optional[Conversation]: Matched Conversation instance, or None if not found or unauthorized.
        """
        return self._repo.get_conversation(session, conversation_id, user_id)

    def get_or_create_conversation(
        self, session: Session, user_id: str, conversation_id: Optional[str] = None
    ) -> Conversation:
        """Fetch an existing conversation or instantiate a new conversation session.

        Args:
            session (Session): Active database session transaction.
            user_id (str): ID of the authenticated user.
            conversation_id (Optional[str]): Target conversation UUID or None.

        Returns:
            Conversation: Matched or newly created Conversation instance.
        """
        if conversation_id:
            conversation = self._repo.get_conversation(session, conversation_id, user_id)
            if conversation:
                return conversation

        return self._repo.create_conversation(session, user_id)

    def add_message(
        self,
        session: Session,
        conversation_id: str,
        user_id: str,
        role: str,
        content: str,
    ) -> Message:
        """Store a new chat message (user or assistant) in the database.

        Args:
            session (Session): Active database session transaction.
            conversation_id (str): Target conversation UUID.
            user_id (str): Owner user ID.
            role (str): Sender role ('user' or 'assistant').
            content (str): Text content body.

        Returns:
            Message: Created Message model instance.
        """
        return self._repo.add_message(session, conversation_id, user_id, role, content)

    def get_history(
        self, session: Session, conversation_id: str, limit: int = 50
    ) -> List[Dict[str, str]]:
        """Fetch chronological message history formatted for AI context window.

        Args:
            session (Session): Active database session.
            conversation_id (str): Target conversation UUID.
            limit (int): Maximum messages to retrieve.

        Returns:
            List[Dict[str, str]]: List of dicts matching [{'role': '...', 'content': '...'}] format.
        """
        messages = self._repo.get_messages(session, conversation_id, limit=limit)
        return [{"role": msg.role, "content": msg.content} for msg in messages]

    def get_latest_conversation_history(
        self, session: Session, user_id: str, limit: int = 50
    ) -> ChatHistoryResponse:
        """Fetch history response for the user's most recent conversation session.

        Args:
            session (Session): Active database session.
            user_id (str): Authenticated user ID.
            limit (int): Maximum messages to retrieve (default 50).

        Returns:
            ChatHistoryResponse: Serialized schema containing conversation ID and message schemas.
        """
        conversation = self._repo.get_latest_conversation(session, user_id)
        if not conversation:
            return ChatHistoryResponse(conversation_id=None, messages=[])

        messages = self._repo.get_messages(session, str(conversation.id), limit=limit)
        schema_messages = [
            ChatMessageSchema(role=msg.role, content=msg.content) for msg in messages
        ]
        return ChatHistoryResponse(
            conversation_id=str(conversation.id),
            messages=schema_messages,
        )

    def get_specific_conversation_history(
        self, session: Session, conversation_id: str, user_id: str, limit: int = 50
    ) -> Optional[ChatHistoryResponse]:
        """Fetch history response for a specific conversation ID after validating ownership.

        Args:
            session (Session): Active database session.
            conversation_id (str): Target conversation UUID string.
            user_id (str): Authenticated user ID.
            limit (int): Maximum messages to retrieve.

        Returns:
            Optional[ChatHistoryResponse]: ChatHistoryResponse payload if authorized, or None if not found.
        """
        conversation = self._repo.get_conversation(session, conversation_id, user_id)
        if not conversation:
            return None

        messages = self._repo.get_messages(session, conversation_id, limit=limit)
        schema_messages = [
            ChatMessageSchema(role=msg.role, content=msg.content) for msg in messages
        ]
        return ChatHistoryResponse(
            conversation_id=conversation_id,
            messages=schema_messages,
        )

    def list_conversations_response(
        self, session: Session, user_id: str, limit: int = 100
    ) -> ConversationListResponse:
        """List conversation summaries for a user formatted into ConversationListResponse schema.

        Args:
            session (Session): Active database session.
            user_id (str): Authenticated user ID.
            limit (int): Maximum conversations to retrieve.

        Returns:
            ConversationListResponse: Wrapped response containing conversation summaries and count.
        """
        conversations = self._repo.get_all_conversations(session, user_id, limit=limit)
        summaries: List[ConversationSummary] = []

        for conv in conversations:
            message_count = self._repo.get_message_count(session, conv.id)
            first_message = self._repo.get_first_message(session, conv.id)
            summaries.append(
                ConversationSummary(
                    id=str(conv.id),
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                    message_count=message_count,
                    first_message_preview=first_message.content if first_message else None,
                )
            )

        return ConversationListResponse(
            conversations=summaries,
            total=len(summaries),
        )


conversation_service = ConversationService(conversation_repo)
