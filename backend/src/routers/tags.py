"""Tag API endpoints."""
from fastapi import APIRouter

from src.api.deps import CurrentUser, DbSession
from src.schemas.task import TagListResponse
from src.services.tag_service import tag_service as tag_crud

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("/", response_model=TagListResponse)
async def list_tags(
    user_id: CurrentUser,
    session: DbSession,
):
    """List all tags for the authenticated user."""
    tag_stats = tag_crud.get_tag_stats(session, user_id)
    tags = [
        {"id": stat["id"], "name": stat["name"], "task_count": stat["task_count"]}
        for stat in tag_stats
    ]
    return {"tags": tags}
# 6 5 5 2.5