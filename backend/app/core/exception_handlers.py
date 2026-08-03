import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.errors import AppError
from app.core.request_context import get_request_id


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        request_id = get_request_id(request)
        logging.getLogger("beichen.errors").warning(
            "app_error request_id=%s method=%s path=%s code=%s status_code=%s error_type=%s message=%s",
            request_id,
            request.method,
            request.url.path,
            exc.code,
            exc.status_code,
            exc.__class__.__name__,
            exc.message,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": exc.code,
                "message": exc.message,
                "request_id": request_id,
                "data": None,
            },
        )
