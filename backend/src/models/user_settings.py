from sqlmodel import SQLModel, Field
from typing import Optional

class UserSettings(SQLModel, table=True):
    """User-specific settings for BYOK LLM Configuration."""
    
    user_id: str = Field(primary_key=True)
    use_custom_llm: bool = Field(default=False)
    
    llm_provider: Optional[str] = Field(default=None)
    llm_model: Optional[str] = Field(default=None)
    llm_api_key: Optional[str] = Field(default=None)
    llm_base_url: Optional[str] = Field(default=None)
