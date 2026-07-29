from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class FileRecord(Base):
    __tablename__ = "files"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    extension: Mapped[str] = mapped_column(String(32), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="uploaded")
    text_preview: Mapped[str | None] = mapped_column(Text, nullable=True)
    char_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    embedding_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    embedding_dimension: Mapped[int | None] = mapped_column(Integer, nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    vector_store_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

