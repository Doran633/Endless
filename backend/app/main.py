from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.chat import router as chat_router
from app.api.v1.files import router as files_router
from app.api.v1.health import router as health_router
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.db.init_db import init_db


app = FastAPI(title=settings.app_name)
register_exception_handlers(app)

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
app.include_router(files_router, prefix="/api/v1")


@app.on_event("startup")
def on_startup() -> None:
    init_db()
