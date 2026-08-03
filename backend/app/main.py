import logging
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.chat import router as chat_router
from app.api.v1.chat import session_router as chat_session_router
from app.api.v1.files import router as files_router
from app.api.v1.health import router as health_router
from app.core.access_control import access_control_middleware
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging_config import configure_logging
from app.core.request_context import REQUEST_ID_HEADER, create_request_id
from app.db.init_db import init_db


configure_logging()
logger = logging.getLogger("beichen.request")
app = FastAPI(title=settings.app_name)
register_exception_handlers(app)
app.middleware("http")(access_control_middleware)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Attach request_id and log lifecycle without logging payloads."""

    request_id = request.headers.get(REQUEST_ID_HEADER) or create_request_id()
    request.state.request_id = request_id
    start_time = perf_counter()
    logger.info(
        "request_start request_id=%s method=%s path=%s",
        request_id,
        request.method,
        request.url.path,
    )

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((perf_counter() - start_time) * 1000, 2)
        logger.exception(
            "request_exception request_id=%s method=%s path=%s duration_ms=%s",
            request_id,
            request.method,
            request.url.path,
            duration_ms,
        )
        raise

    duration_ms = round((perf_counter() - start_time) * 1000, 2)
    response.headers[REQUEST_ID_HEADER] = request_id
    logger.info(
        "request_complete request_id=%s method=%s path=%s status_code=%s duration_ms=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(chat_router, prefix="/api/v1")
app.include_router(chat_session_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")


@app.on_event("startup")
def on_startup() -> None:
    init_db()
