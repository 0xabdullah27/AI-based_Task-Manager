"""Tag API router endpoints for listing user task categories.

This layer handles HTTP parsing, status codes, OpenAPI schemas, and delegates
all business logic and data transformations to TagService.
"""
from fastapi import APIRouter
import logging

from src.api.deps import CurrentUser, DbSession
from src.schemas.task import TagListResponse
from src.services.tag_service import tag_service


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("/", response_model=TagListResponse)
async def list_tags(
    user_id: CurrentUser,
    session: DbSession,
) -> TagListResponse:
    """List all tag categories and task counts for the authenticated user.

    Args:
        user_id (CurrentUser): Authenticated user ID dependency for user isolation.
        session (DbSession): Active SQLModel database session dependency.

    Returns:
        TagListResponse: Serialized tag list response containing tag names and task count stats.
    """
    return tag_service.get_tag_list_response(session, user_id)