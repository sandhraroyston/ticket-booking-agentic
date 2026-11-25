"""Shared fixtures.

The "DB up" tests need a real PostgreSQL. Resolution order:
1. ``TEST_DATABASE_URL`` (CI sets this to its Postgres service container);
2. a throwaway testcontainers Postgres 16, if Docker is available;
3. otherwise skip, unless ``REQUIRE_DB_TESTS=1`` (set in CI), in which case fail.
"""

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

# Nothing listens on port 1, so connections are refused immediately.
UNREACHABLE_DATABASE_URL = "postgresql+psycopg://nobody:not-a-real-secret@127.0.0.1:1/nowhere"


def _make_client(database_url: str) -> TestClient:
    settings = Settings(database_url=database_url, db_connect_timeout_seconds=1)
    return TestClient(create_app(settings))


@pytest.fixture(scope="session")
def postgres_url() -> Iterator[str]:
    url = os.environ.get("TEST_DATABASE_URL")
    if url:
        yield url
        return
    try:
        from testcontainers.community.postgres import PostgresContainer

        container = PostgresContainer("postgres:16-alpine", driver="psycopg")
        container.start()
    except Exception as exc:  # noqa: BLE001 - any Docker failure means "no DB available"
        if os.environ.get("REQUIRE_DB_TESTS") == "1":
            pytest.fail(f"PostgreSQL required but unavailable: {type(exc).__name__}")
        pytest.skip(f"No PostgreSQL: set TEST_DATABASE_URL or start Docker ({type(exc).__name__})")
    try:
        yield container.get_connection_url()
    finally:
        container.stop()


@pytest.fixture
def client_db_down() -> Iterator[TestClient]:
    with _make_client(UNREACHABLE_DATABASE_URL) as client:
        yield client


@pytest.fixture
def client_db_up(postgres_url: str) -> Iterator[TestClient]:
    with _make_client(postgres_url) as client:
        yield client
