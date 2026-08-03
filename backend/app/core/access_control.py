from collections.abc import Awaitable, Callable
from hmac import compare_digest

from fastapi import Request, Response
from fastapi.responses import JSONResponse

from app.core.config import settings


async def access_control_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Protect API routes with invite codes or the legacy shared password."""

    if not request.url.path.startswith("/api/v1/") or not _access_control_enabled():
        return await call_next(request)

    provided_code = request.headers.get(settings.app_access_header)
    if not provided_code or not _is_valid_access_code(provided_code):
        return JSONResponse(
            status_code=401,
            content={
                "code": 41001,
                "message": "Invite code is required or invalid",
                "data": None,
            },
        )

    return await call_next(request)


def _access_control_enabled() -> bool:
    return bool(settings.app_invite_codes or settings.app_access_password)


def _is_valid_access_code(provided_code: str) -> bool:
    if settings.app_invite_codes:
        return any(compare_digest(provided_code, code) for code in settings.app_invite_codes)

    if settings.app_access_password:
        return compare_digest(provided_code, settings.app_access_password)

    return True
