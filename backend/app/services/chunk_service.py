from app.core.config import settings
from app.core.errors import ChunkError
from app.db.database import SessionLocal
from app.repositories.file_repository import FileRepository
from app.schemas.file import ChunkFileResponse, DocumentChunk


class ChunkService:
    preview_limit = 3

    def __init__(self, chunk_size: int | None = None, chunk_overlap: int | None = None) -> None:
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap if chunk_overlap is not None else settings.chunk_overlap

    def chunk_text(self, file_id: str, text: str, client_id: str) -> ChunkFileResponse:
        try:
            chunks = self.create_chunks(file_id, text)
            with SessionLocal() as db:
                FileRepository(db).update_chunked(file_id, client_id, chunk_count=len(chunks))
            return ChunkFileResponse(
                file_id=file_id,
                status="chunked",
                chunk_count=len(chunks),
                chunk_preview=chunks[: self.preview_limit],
            )
        except Exception as exc:
            self._mark_failed(file_id, client_id, str(exc))
            raise

    def create_chunks(self, file_id: str, text: str) -> list[DocumentChunk]:
        normalized_text = self._normalize_text(text)
        if not normalized_text:
            raise ChunkError("Cannot chunk empty document text")

        chunks = self._split_text(file_id, normalized_text)
        if not chunks:
            raise ChunkError("No chunks generated from document text")

        return chunks

    def create_file_chunks(
        self, file_id: str, text: str, client_id: str | None = None
    ) -> list[DocumentChunk]:
        try:
            return self.create_chunks(file_id, text)
        except Exception as exc:
            if client_id is not None:
                self._mark_failed(file_id, client_id, str(exc))
            raise

    def _mark_failed(self, file_id: str, client_id: str, error_message: str) -> None:
        try:
            with SessionLocal() as db:
                FileRepository(db).touch_failed(file_id, client_id, error_message)
        except Exception:
            pass

    def _normalize_text(self, text: str) -> str:
        paragraphs = [paragraph.strip() for paragraph in text.split("\n") if paragraph.strip()]
        return "\n".join(paragraphs)

    def _split_text(self, file_id: str, text: str) -> list[DocumentChunk]:
        chunks: list[DocumentChunk] = []
        start = 0
        index = 0

        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            content = text[start:end].strip()
            if content:
                chunks.append(
                    DocumentChunk(
                        chunk_id=f"{file_id}-{index}",
                        file_id=file_id,
                        chunk_index=index,
                        content=content,
                        char_count=len(content),
                    )
                )
                index += 1

            if end >= len(text):
                break

            start = max(end - self.chunk_overlap, start + 1)

        return chunks
