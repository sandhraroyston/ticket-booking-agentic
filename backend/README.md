# Backend

FastAPI + SQLAlchemy 2 on Python 3.12, managed with [uv](https://docs.astral.sh/uv/).
`openapi.yaml` at the repo root is the API contract.

```bash
uv sync                                   # install deps from uv.lock
make db                                   # (repo root) start Postgres 16 for local dev
uv run uvicorn app.main:app --reload      # http://localhost:8000/healthz, /readyz
uv run ruff check . && uv run mypy        # lint (or `make lint` at the root)
uv run pytest                             # tests (or `make test` at the root)
```

## Configuration (environment variables only)

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://tickets:tickets@localhost:5432/tickets` | Contains credentials, never logged |
| `DB_CONNECT_TIMEOUT_SECONDS` | `2` | Bounds how long `/readyz` waits |
| `LOG_LEVEL` | `INFO` | Logs are JSON lines on stdout |

## Tests that need PostgreSQL

The "DB up" readiness test uses `TEST_DATABASE_URL` if set, otherwise a testcontainers
Postgres 16 (needs Docker), otherwise it is skipped. CI sets `REQUIRE_DB_TESTS=1`, which turns
that skip into a failure.
