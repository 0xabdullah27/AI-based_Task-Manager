"""Service layer for conversation management."""
from sqlmodel import Session
from typing import List, Optional

from src.models.conversation import Conversation
from src.models.message import Message
from src.repositories.conversation_repo import conversation_repo, ConversationRepository


class ConversationService:
    """Business logic for conversation operations.

    Handles the stateless conversation flow per spec:
    1. Get or create conversation
    2. Fetch history from DB
    3. Add messages
    """

    def __init__(self, repo: ConversationRepository):
        self._repo = repo

    def get_or_create_conversation(
        self, session: Session, 
        user_id: str, 
        conversation_id: Optional[str] = None
    ) -> Conversation:
        """Get existing conversation or create a new one.

        If conversation_id is provided, fetches it (ensures user ownership).
        If not provided, creates a new conversation.
        """
        if conversation_id:
            conversation = self._repo.get_conversation(
                session, conversation_id, user_id
            )
            if conversation:
                return conversation
            # If conversation not found, create a new one
            # (could also raise an error, but spec says "creates new if not provided")

        return self._repo.create_conversation(session, user_id)

    def add_message(
        self,
        session: Session,
        conversation_id: str,
        user_id: str,
        role: str,
        content: str,
    ) -> Message:
        """Store a message (user or assistant) in the database."""
        return self._repo.add_message(
            session, conversation_id, user_id, role, content
        )

    def get_history(
        self, session: Session, conversation_id: str, limit: int = 50
    ) -> List[dict]:
        """Fetch conversation history as a list of message dicts.

        Returns format suitable for OpenAI Agents SDK:
        [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]
        """
        messages = self._repo.get_messages(session, conversation_id, limit=limit)
        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

    def get_latest_conversation_history(self, session: Session, user_id: str, limit: int = 50) -> dict:
        """Fetch the user's latest conversation and its messages.

        Returns {"conversation_id": Optional[str], "messages": list[dict]}
        """
        conversation = self._repo.get_latest_conversation(session, user_id)
        if not conversation:
            return {"conversation_id": None, "messages": []}

        messages = self._repo.get_messages(session, str(conversation.id), limit=limit)
        return {
            "conversation_id": str(conversation.id),
            "messages": [{"role": msg.role, "content": msg.content} for msg in messages]
        }

    def list_conversations(
        self, session: Session, user_id: str, limit: int = 100
    ) -> List[dict]:
        """List all conversations for a user with metadata.
        
        Returns list of conversation summaries with:
        - id: Conversation UUID
        - created_at: When conversation was created
        - updated_at: Last message time
        - message_count: Total messages in conversation
        - first_message_preview: First message content (for preview)
        """
        conversations = self._repo.get_all_conversations(session, user_id, limit)
        
        result = []
        for conv in conversations:
            message_count = self._repo.get_message_count(session, conv.id)
            first_message = self._repo.get_first_message(session, conv.id)
            
            result.append({
                "id": str(conv.id),
                "created_at": conv.created_at,
                "updated_at": conv.updated_at,
                "message_count": message_count,
                "first_message_preview": first_message.content if first_message else None,
            })
        
        return result


# Module-level singleton
conversation_service = ConversationService(conversation_repo)
