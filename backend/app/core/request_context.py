from uuid import uuid4

from fastapi import Request


REQUEST_ID_HEADER = "X-Request-Id"


def create_request_id() -> str:
    """Create a correlation id for one HTTP request."""

    return uuid4().hex


def get_request_id(request: Request) -> str:
    """Read the request id attached by middleware without failing handlers."""

    return getattr(request.state, "request_id", "")
