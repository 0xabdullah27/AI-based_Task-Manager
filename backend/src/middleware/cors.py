"""CORS middleware configuration"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings


def configure_cors(app: FastAPI) -> None:
    """Configure CORS middleware for the application"""
    origins = list(settings.cors_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Cookie", "Accept", "X-Requested-With"],
        max_age=3600,  # Cache preflight requests for 1 hour
    )
