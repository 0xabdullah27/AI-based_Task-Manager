"""Data access repository layer for Conversation and Message models."""
from sqlmodel import Session, select, func
from typing import List, Optional

from src.models.conversation import Conversation
from src.models.message import Message
from src.utils.helpers import utc_now


class ConversationRepository:
    """Repository class encapsulating database operations for conversations and messages."""

    def create_conversation(self, session: Session, user_id: str) -> Conversation:
        """Create and commit a new Conversation record for a user.

        Args:
            session (Session): Active database session.
            user_id (str): ID of the owning user.

        Returns:
            Conversation: Newly created Conversation instance with committed state.
        """
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
        return conversation

    def get_conversation(
        self, session: Session, conversation_id: str, user_id: str
    ) -> Optional[Conversation]:
        """Fetch a specific conversation by ID scoped to the owning user.

        Args:
            session (Session): Active database session.
            conversation_id (str): Unique UUID string of the conversation.
            user_id (str): Owner user ID for row-level security.

        Returns:
            Optional[Conversation]: Matched Conversation instance, or None if unauthorized/not found.
        """
        statement = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        return session.exec(statement).first()

    def get_latest_conversation(self, session: Session, user_id: str) -> Optional[Conversation]:
        """Fetch the most recently updated conversation for a user.

        Args:
            session (Session): Active database session.
            user_id (str): Owner user ID.

        Returns:
            Optional[Conversation]: Most recently updated Conversation instance, or None.
        """
        statement = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )
        return session.exec(statement).first()

    def get_all_conversations(
        self, session: Session, user_id: str, limit: int = 100
    ) -> List[Conversation]:
        """Fetch all conversations for a user ordered by last update (newest first).

        Args:
            session (Session): Active database session.
            user_id (str): Owner user ID.
            limit (int): Maximum number of conversations to retrieve (default 100).

        Returns:
            List[Conversation]: List of Conversation instances sorted by updated_at desc.
        """
        statement = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
        )
        return list(session.exec(statement).all())

    def get_message_count(
        self, session: Session, conversation_id: str
    ) -> int:
        """Count the total number of messages in a conversation.

        Args:
            session (Session): Active database session.
            conversation_id (str): Target conversation UUID string.

        Returns:
            int: Message count integer.
        """
        statement = select(func.count(Message.id)).where(
            Message.conversation_id == conversation_id
        )
        return session.exec(statement).one()

    def get_first_message(
        self, session: Session, conversation_id: str
    ) -> Optional[Message]:
        """Fetch the initial message in a conversation for display preview.

        Args:
            session (Session): Active database session.
            conversation_id (str): Target conversation UUID string.

        Returns:
            Optional[Message]: The earliest Message record created, or None.
        """
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(1)
        )
        return session.exec(statement).first()

    def add_message(
        self,
        session: Session,
        conversation_id: str,
        user_id: str,
        role: str,
        content: str,
    ) -> Message:
        """Insert a new chat message and update the parent conversation's updated_at timestamp.

        Args:
            session (Session): Active database session.
            conversation_id (str): Parent conversation UUID string.
            user_id (str): User ID owning the conversation.
            role (str): Sender role ('user' or 'assistant').
            content (str): Message text body.

        Returns:
            Message: Inserted Message instance with refreshed database state.
        """
        message = Message(
            conversation_id=conversation_id,
            user_id=user_id,
            role=role,
            content=content,
        )
        session.add(message)

        conversation = session.get(Conversation, conversation_id)
        if conversation:
            conversation.updated_at = utc_now()
            session.add(conversation)

        session.commit()
        session.refresh(message)
        return message

    def get_messages(
        self,
        session: Session,
        conversation_id: str,
        limit: int = 50,
    ) -> List[Message]:
        """Fetch messages belonging to a conversation ordered chronologically.

        Args:
            session (Session): Active database session.
            conversation_id (str): Target conversation UUID string.
            limit (int): Maximum number of messages to return.

        Returns:
            List[Message]: List of Message records ordered by created_at asc.
        """
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        return list(session.exec(statement).all())


conversation_repo = ConversationRepository()
