from collections.abc import Awaitable, Callable
from hmac import compare_digest

from fastapi import Request, Response
from fastapi.responses import JSONResponse

from app.core.config import settings


async def access_control_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Protect API routes with a single shared access password when configured."""

    if not request.url.path.startswith("/api/v1/") or not settings.app_access_password:
        return await call_next(request)

    provided_password = request.headers.get(settings.app_access_header)
    if not provided_password or not compare_digest(
        provided_password, settings.app_access_password
    ):
        return JSONResponse(
            status_code=401,
            content={
                "code": 41001,
                "message": "Access password is required or invalid",
                "data": None,
            },
        )

    return await call_next(request)
