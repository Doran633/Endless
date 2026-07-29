from app.core.config import settings
from app.db.database import Base, engine
from app.db import models  # noqa: F401


def init_db() -> None:
    # SQLite needs the parent directory to exist before SQLAlchemy opens the file.
    if settings.database_url.startswith("sqlite"):
        settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)

