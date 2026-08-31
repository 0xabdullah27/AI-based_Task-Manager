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

    # JWT - Better Auth uses EdDSA (Ed25519) by default, audience is optional
    jwt_algorithm: str = "EdDSA"
    jwt_audience: Optional[str] = None

    # Application
    app_name: str = "Todo Backend"
    debug: bool = False

    # LLM Configuration
    llm_api_key: Optional[str] = None
    
    # BYOK Encryption Key (Fernet 32-byte url-safe base64-encoded string)
    encryption_key: Optional[str] = None
    
    llm_provider: Literal["openrouter", "openai", "gemini", "mistral", "groq", "freetokenfaucet", "custom"] = "mistral"
    llm_model: str = "mistral-medium-latest"
    llm_base_url: Optional[str] = None

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


# Global settings instance
settings = Settings()
