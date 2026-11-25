"""Liveness and readiness probes (openapi.yaml: getHealth, getReadiness)."""

import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy import Engine
from sqlalchemy.exc import SQLAlchemyError

from app.db import ping
from app.schemas import Error, HealthStatus

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/healthz", operation_id="getHealth", response_model=HealthStatus)
def get_health() -> HealthStatus:
    """Returns 200 while the process is up. Does not touch the database."""
    return HealthStatus()


@router.get(
    "/readyz",
    operation_id="getReadiness",
    response_model=HealthStatus,
    responses={503: {"model": Error, "description": "Not ready (PostgreSQL is unreachable)."}},
)
def get_readiness(request: Request) -> HealthStatus | JSONResponse:
    """Returns 200 if PostgreSQL is reachable, otherwise 503."""
    engine: Engine = request.app.state.engine
    try:
        ping(engine)
    except (SQLAlchemyError, OSError) as exc:
        # Log the exception type only: the message may include host, user or the DSN.
        logger.warning(
            "readiness check failed",
            extra={"event": "readiness_failed", "error_type": type(exc).__name__},
        )
        body = Error(code="not_ready", message="Database unavailable")
        return JSONResponse(status_code=503, content=body.model_dump(exclude_none=True))
    return HealthStatus()
