"""Application configuration using Pydantic Settings."""
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import List, Literal, Optional
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = "sqlite:///./test.db"

    # Better Auth
    better_auth_url: str = "http://localhost:3000"
    
    # no need the secret key for EdDSA, as that uses public/private key pairs.

    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]

    # JWT - Better Auth uses EdDSA (Ed25519) by default, audience is BASE_URL
    jwt_algorithm: str = "EdDSA"
    jwt_audience: Optional[str] = None

    # Application
    app_name: str = "Todo Backend"
    debug: bool = False

    # LLM Configuration (for OpenAI Agents SDK)
    openrouter_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    
    llm_provider: Literal["openrouter", "openai", "gemini"] = "openrouter"
    llm_model: str = "openai/gpt-4o-mini"

    jwt_token: Optional[str] = ""

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from JSON string or list."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        return v

    @field_validator("jwt_audience", mode="before")
    @classmethod
    def set_jwt_audience(cls, v, info):
        """Set JWT audience to better_auth_url if not explicitly set."""
        if v is None:
            return info.data.get("better_auth_url", "http://localhost:3000")
        return v


# Global settings instance
settings = Settings()
