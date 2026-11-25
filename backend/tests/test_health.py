"""Health endpoints, checked against openapi.yaml (getHealth, getReadiness)."""

import json
import logging

import pytest
from fastapi.testclient import TestClient

from app.logging_config import JsonFormatter


def test_healthz_returns_ok_without_database(client_db_down: TestClient) -> None:
    response = client_db_down.get("/healthz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readyz_returns_ok_when_database_is_reachable(client_db_up: TestClient) -> None:
    response = client_db_up.get("/readyz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readyz_returns_503_when_database_is_unreachable(client_db_down: TestClient) -> None:
    response = client_db_down.get("/readyz")

    assert response.status_code == 503
    assert response.json() == {"code": "not_ready", "message": "Database unavailable"}


def test_readyz_failure_log_is_json_without_credentials(
    client_db_down: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.WARNING):
        client_db_down.get("/readyz")

    formatter = JsonFormatter()
    lines = [formatter.format(record) for record in caplog.records]
    records = [json.loads(line) for line in lines]
    failure = next(r for r in records if r.get("event") == "readiness_failed")
    assert failure["level"] == "WARNING"
    assert failure["error_type"]
    joined = "\n".join(lines)
    assert "not-a-real-secret" not in joined
    assert "postgresql" not in joined


def test_openapi_operation_ids_match_contract(client_db_down: TestClient) -> None:
    paths = client_db_down.get("/openapi.json").json()["paths"]

    assert paths["/healthz"]["get"]["operationId"] == "getHealth"
    assert paths["/readyz"]["get"]["operationId"] == "getReadiness"
    assert "503" in paths["/readyz"]["get"]["responses"]


def test_json_formatter_drops_unknown_extra_fields() -> None:
    record = logging.LogRecord("t", logging.INFO, __file__, 1, "hello", None, None)
    record.email = "someone@example.com"
    record.event = "test_event"

    payload = json.loads(JsonFormatter().format(record))

    assert payload["event"] == "test_event"
    assert payload["message"] == "hello"
    assert "email" not in payload
