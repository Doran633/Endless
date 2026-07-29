from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.errors import (
    FileDeleteError,
    FileRecordNotFoundError,
    FileStorageError,
    FileValidationError,
)
from app.db.database import SessionLocal
from app.db.models import FileRecord
from app.repositories.file_repository import FileRepository
from app.schemas.file import (
    DeleteFileResponse,
    FileListResponse,
    FileRecordResponse,
    UploadedFileResponse,
)


class FileService:
    async def upload(self, file: UploadFile) -> UploadedFileResponse:
        original_name = Path(file.filename or "").name
        if not original_name:
            raise FileValidationError("File name is required")

        extension = self._get_extension(original_name)
        self._validate_extension(extension)

        file_id = str(uuid4())
        storage_path = settings.upload_dir / f"{file_id}.{extension}"
        settings.upload_dir.mkdir(parents=True, exist_ok=True)

        size_bytes = await self._save_file(file, storage_path)
        try:
            with SessionLocal() as db:
                record = FileRepository(db).create_uploaded_file(
                    file_id=file_id,
                    original_name=original_name,
                    extension=extension,
                    size_bytes=size_bytes,
                    storage_path=storage_path,
                )
                return UploadedFileResponse(
                    id=record.id,
                    original_name=record.original_name,
                    status=record.status,
                    size_bytes=record.size_bytes,
                    extension=record.extension,
                    created_at=record.created_at.isoformat(),
                )
        except SQLAlchemyError as exc:
            storage_path.unlink(missing_ok=True)
            raise FileStorageError("Failed to save file metadata") from exc

    def list_files(self) -> FileListResponse:
        with SessionLocal() as db:
            records = FileRepository(db).list_files()
            return FileListResponse(files=[self._to_file_response(record) for record in records])

    def delete_file(self, file_id: str) -> DeleteFileResponse:
        with SessionLocal() as db:
            repository = FileRepository(db)
            record = repository.get_file(file_id)
            if record is None:
                raise FileRecordNotFoundError()

            original_path = settings.upload_dir / f"{record.id}.{record.extension}"
            vector_index_path = settings.vector_store_dir / f"{record.id}.json"

            try:
                original_deleted = self._delete_path(original_path)
                vector_index_deleted = self._delete_path(vector_index_path)
                if not repository.delete_file(file_id):
                    raise FileRecordNotFoundError()
            except FileRecordNotFoundError:
                raise
            except (OSError, SQLAlchemyError) as exc:
                db.rollback()
                raise FileDeleteError() from exc

        return DeleteFileResponse(
            file_id=file_id,
            deleted=True,
            original_deleted=original_deleted,
            vector_index_deleted=vector_index_deleted,
        )

    def _get_extension(self, filename: str) -> str:
        extension = Path(filename).suffix.lower().lstrip(".")
        if not extension:
            raise FileValidationError("File extension is required")
        return extension

    def _validate_extension(self, extension: str) -> None:
        if extension not in settings.allowed_upload_extensions:
            allowed = ", ".join(settings.allowed_upload_extensions)
            raise FileValidationError(f"Unsupported file type. Allowed: {allowed}")

    async def _save_file(self, file: UploadFile, storage_path: Path) -> int:
        max_size = settings.max_upload_size_mb * 1024 * 1024
        size = 0

        try:
            with storage_path.open("wb") as output:
                while chunk := await file.read(1024 * 1024):
                    size += len(chunk)
                    if size > max_size:
                        output.close()
                        storage_path.unlink(missing_ok=True)
                        raise FileValidationError(
                            f"File is too large. Max size: {settings.max_upload_size_mb} MB"
                        )
                    output.write(chunk)
        except FileValidationError:
            raise
        except OSError as exc:
            storage_path.unlink(missing_ok=True)
            raise FileStorageError("Failed to save uploaded file") from exc
        finally:
            await file.close()

        return size

    def _delete_path(self, path: Path) -> bool:
        if not path.exists():
            return False
        if not path.is_file():
            raise FileDeleteError("File storage target is not a regular file")
        path.unlink()
        return True

    def _to_file_response(self, record: FileRecord) -> FileRecordResponse:
        return FileRecordResponse(
            id=record.id,
            original_name=record.original_name,
            status=record.status,
            size_bytes=record.size_bytes,
            extension=record.extension,
            created_at=record.created_at.isoformat(),
            updated_at=record.updated_at.isoformat(),
            text_preview=record.text_preview,
            char_count=record.char_count,
            chunk_count=record.chunk_count,
            embedding_count=record.embedding_count,
            embedding_dimension=record.embedding_dimension,
            embedding_model=record.embedding_model,
            vector_store_path=record.vector_store_path,
            error_message=record.error_message,
        )
