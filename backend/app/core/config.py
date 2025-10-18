# backend/app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./social_ai.db"
    
    # Facebook
    FACEBOOK_APP_ID: Optional[str] = None
    FACEBOOK_APP_SECRET: Optional[str] = None
    
    # AI
    OLLAMA_HOST: str = "http://localhost:11434"
    DEFAULT_MODEL: str = "llama2:7b"
    
    # Features
    USE_MOCK_FACEBOOK: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()