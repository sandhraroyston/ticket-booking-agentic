"""Database engine and connectivity check."""

from sqlalchemy import Engine, create_engine, text

from app.config import Settings


def create_db_engine(settings: Settings) -> Engine:
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": settings.db_connect_timeout_seconds},
    )


def ping(engine: Engine) -> None:
    """Run ``SELECT 1``. Raises if PostgreSQL is unreachable."""
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
