"""Shared dependency type aliases for API endpoints."""
from typing import Annotated
from fastapi import Depends
from sqlmodel import Session

from src.core.database import get_session
from src.core.security import get_current_user

# Reusable type aliases — use these in all route signatures
CurrentUser = Annotated[str, Depends(get_current_user)]
DbSession = Annotated[Session, Depends(get_session)]
