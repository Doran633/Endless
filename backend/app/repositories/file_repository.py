from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import FileRecord


class FileRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_uploaded_file(
        self,
        *,
        client_id: str,
        file_id: str,
        original_name: str,
        extension: str,
        size_bytes: int,
        storage_path: Path,
    ) -> FileRecord:
        record = FileRecord(
            id=file_id,
            client_id=client_id,
            original_name=original_name,
            extension=extension,
            size_bytes=size_bytes,
            storage_path=str(storage_path),
            status="uploaded",
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def list_files(self, client_id: str) -> list[FileRecord]:
        statement = (
            select(FileRecord)
            .where(FileRecord.client_id == client_id)
            .order_by(FileRecord.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_file(self, file_id: str, client_id: str) -> FileRecord | None:
        statement = select(FileRecord).where(
            FileRecord.id == file_id,
            FileRecord.client_id == client_id,
        )
        return self.db.scalars(statement).first()

    def delete_file(self, file_id: str, client_id: str) -> bool:
        record = self.get_file(file_id, client_id)
        if record is None:
            return False
        self.db.delete(record)
        self.db.commit()
        return True

    def update_parsed(
        self, file_id: str, client_id: str, *, text_preview: str, char_count: int
    ) -> None:
        record = self.get_file(file_id, client_id)
        if record is None:
            return
        record.status = "ready"
        record.text_preview = text_preview
        record.char_count = char_count
        record.error_message = None
        record.updated_at = datetime.now(timezone.utc)
        self.db.commit()

    def update_chunked(self, file_id: str, client_id: str, *, chunk_count: int) -> None:
        record = self.get_file(file_id, client_id)
        if record is None:
            return
        record.status = "chunked"
        record.chunk_count = chunk_count
        record.error_message = None
        record.updated_at = datetime.now(timezone.utc)
        self.db.commit()

    def update_embedded(
        self,
        file_id: str,
        client_id: str,
        *,
        chunk_count: int,
        embedding_count: int,
        embedding_dimension: int,
        embedding_model: str,
    ) -> None:
        record = self.get_file(file_id, client_id)
        if record is None:
            return
        record.status = "embedded"
        record.chunk_count = chunk_count
        record.embedding_count = embedding_count
        record.embedding_dimension = embedding_dimension
        record.embedding_model = embedding_model
        record.error_message = None
        record.updated_at = datetime.now(timezone.utc)
        self.db.commit()

    def update_indexed(
        self,
        file_id: str,
        client_id: str,
        *,
        chunk_count: int,
        embedding_count: int,
        embedding_dimension: int,
        embedding_model: str,
        vector_store_path: str,
    ) -> None:
        record = self.get_file(file_id, client_id)
        if record is None:
            return
        record.status = "indexed"
        record.chunk_count = chunk_count
        record.embedding_count = embedding_count
        record.embedding_dimension = embedding_dimension
        record.embedding_model = embedding_model
        record.vector_store_path = vector_store_path
        record.error_message = None
        record.updated_at = datetime.now(timezone.utc)
        self.db.commit()

    def touch_failed(self, file_id: str, client_id: str, error_message: str) -> None:
        record = self.get_file(file_id, client_id)
        if record is None:
            return
        record.status = "failed"
        record.error_message = error_message
        record.updated_at = datetime.now(timezone.utc)
        self.db.commit()
