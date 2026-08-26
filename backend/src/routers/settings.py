"""Settings routes for managing BYOK configuration."""
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional

from src.middleware.rate_limit import limiter
from src.api.deps import get_current_user, DbSession
from src.models.user_settings import UserSettings
from src.utils.encryption import encrypt_value, decrypt_value

router = APIRouter(prefix="/api/settings", tags=["settings"])

class LLMSettingsResponse(BaseModel):
    use_custom_llm: bool
    llm_provider: Optional[str]
    llm_model: Optional[str]
    has_api_key: bool
    llm_base_url: Optional[str]

class LLMSettingsUpdate(BaseModel):
    use_custom_llm: bool
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None
    llm_base_url: Optional[str] = None


@router.get("/llm", response_model=LLMSettingsResponse)
@limiter.limit("30/minute")
async def get_llm_settings(
    request: Request,
    session: DbSession,
    user_id: str = Depends(get_current_user)
):
    """Get the current user's LLM configuration settings."""
    settings = session.get(UserSettings, user_id)
    if not settings:
        return LLMSettingsResponse(
            use_custom_llm=False,
            llm_provider=None,
            llm_model=None,
            has_api_key=False,
            llm_base_url=None
        )
    
    return LLMSettingsResponse(
        use_custom_llm=settings.use_custom_llm,
        llm_provider=settings.llm_provider,
        llm_model=settings.llm_model,
        has_api_key=bool(settings.llm_api_key),
        llm_base_url=settings.llm_base_url
    )

@router.put("/llm", response_model=LLMSettingsResponse)
@limiter.limit("30/minute")
async def update_llm_settings(
    request: Request,
    update_data: LLMSettingsUpdate,
    session: DbSession,
    user_id: str = Depends(get_current_user)
):
    """Update the current user's LLM configuration settings."""
    settings = session.get(UserSettings, user_id)
    
    if not settings:
        settings = UserSettings(user_id=user_id)
        session.add(settings)
        
    settings.use_custom_llm = update_data.use_custom_llm
    
    if update_data.llm_provider is not None:
        settings.llm_provider = update_data.llm_provider
        
    if update_data.llm_model is not None:
        settings.llm_model = update_data.llm_model
        
    if update_data.llm_base_url is not None:
        settings.llm_base_url = update_data.llm_base_url
        
    # Only update the API key if a new one was actually provided (not empty and not a placeholder)
    if update_data.llm_api_key and update_data.llm_api_key != "********":
        settings.llm_api_key = encrypt_value(update_data.llm_api_key)
        
    session.commit()
    session.refresh(settings)
    
    return LLMSettingsResponse(
        use_custom_llm=settings.use_custom_llm,
        llm_provider=settings.llm_provider,
        llm_model=settings.llm_model,
        has_api_key=bool(settings.llm_api_key),
        llm_base_url=settings.llm_base_url
    )
