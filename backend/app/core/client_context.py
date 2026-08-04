from typing import Annotated

from fastapi import Header

from app.core.errors import ClientIdError


CLIENT_ID_HEADER = "X-Beichen-Client-Id"
MAX_CLIENT_ID_LENGTH = 128


def get_client_id(
    client_id: Annotated[str | None, Header(alias=CLIENT_ID_HEADER)] = None,
) -> str:
    """Read the anonymous client id used for MVP data isolation."""

    normalized = (client_id or "").strip()
    if not normalized:
        raise ClientIdError()
    if len(normalized) > MAX_CLIENT_ID_LENGTH:
        raise ClientIdError("Client id is too long")
    return normalized
