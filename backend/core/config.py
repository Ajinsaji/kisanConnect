from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_name: str = "KissanConnect API"
    debug: bool = True

    database_url: str = "postgresql+psycopg://postgres:admin1969@localhost:5432/kissanconnect"
    secret_key: str = "CHANGE_THIS_SECRET"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    class Config:
        env_file = ".env"

    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        if not self.cors_origins:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()


