import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Dana Manufacturing Enterprise Operations Platform"
    VERSION: str = "1.0"
    
    # Security
    SECRET_KEY: str = "SUPER_SECRET_DIBMS_JWT_KEY_FOR_LOCAL_DEVELOPMENT_CHANGE_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for ease of POC testing
    
    # Database
    DATABASE_URL: str = "sqlite:///./dibms.db"
    
    # Uploads
    UPLOAD_DIR: str = "uploads"

    class Config:
        case_sensitive = True
        env_file = ".env"

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from env var (comma-separated string) or use defaults."""
        env_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
        if env_origins:
            return [origin.strip() for origin in env_origins.split(",") if origin.strip()]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:4173",
        ]

settings = Settings()
