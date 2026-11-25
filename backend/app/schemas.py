"""Pydantic models mirroring ``components/schemas`` in openapi.yaml."""

from typing import Any, Literal

from pydantic import BaseModel


class HealthStatus(BaseModel):
    status: Literal["ok"] = "ok"


class Error(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None
