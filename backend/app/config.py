"""Application settings, read from environment variables only."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Every field maps to an environment variable."""

    model_config = SettingsConfigDict(env_prefix="", case_sensitive=False, extra="ignore")

    database_url: str = Field(
        default="postgresql+psycopg://tickets:tickets@localhost:5432/tickets",
        description="SQLAlchemy URL for PostgreSQL. Contains credentials, never log it.",
    )
    db_connect_timeout_seconds: int = Field(default=2, ge=1)
    log_level: str = Field(default="INFO")


@lru_cache
def get_settings() -> Settings:
    return Settings()
