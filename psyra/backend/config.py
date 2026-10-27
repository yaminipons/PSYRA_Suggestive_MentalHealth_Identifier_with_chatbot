"""
Configuration module for PSYRA FastAPI Backend.
Loads environment variables using Pydantic Settings.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # App Information
    APP_NAME: str = "PSYRA - Psychological Relief Assistant"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Server Binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000"
    
    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "psyra_db"
    
    # JWT Authentication
    JWT_SECRET: str = "psyra-super-secret-jwt-key-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Grok xAI API
    XAI_API_KEY: str = Field(default="", env="XAI_API_KEY")
    XAI_MODEL: str = Field(default="grok-beta", env="XAI_MODEL")
    XAI_BASE_URL: str = "https://api.x.ai/v1"
    
    # Request Timeouts & Limits
    HTTP_TIMEOUT_SECONDS: float = 30.0
    MAX_REQUEST_SIZE_BYTES: int = 2 * 1024 * 1024  # 2MB
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
