from app.core.config import settings
from app.db.database import Base, engine
from app.db import models  # noqa: F401
from sqlalchemy import text


def init_db() -> None:
    # SQLite needs the parent directory to exist before SQLAlchemy opens the file.
    if settings.database_url.startswith("sqlite"):
        settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    if settings.database_url.startswith("sqlite"):
        _ensure_sqlite_client_id_columns()


def _ensure_sqlite_client_id_columns() -> None:
    # Lightweight compatibility for existing MVP SQLite files. Deployment still
    # clears old shared data, but this prevents old local DBs from crashing.
    with engine.begin() as connection:
        for table_name in ("files", "chat_sessions"):
            columns = connection.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
            if columns and "client_id" not in {column[1] for column in columns}:
                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        "ADD COLUMN client_id TEXT NOT NULL DEFAULT 'legacy'"
                    )
                )
