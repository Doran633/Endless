from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings
from app.core.errors import FileStorageError, FileValidationError
from app.schemas.file import UploadedFileResponse


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
        return UploadedFileResponse(
            id=file_id,
            original_name=original_name,
            status="uploaded",
            size_bytes=size_bytes,
            extension=extension,
            created_at=datetime.now(timezone.utc).isoformat(),
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
