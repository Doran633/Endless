import json
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.core.errors import VectorStoreError, VectorStoreNotFoundError
from app.db.database import SessionLocal
from app.repositories.file_repository import FileRepository
from app.schemas.file import (
    DocumentChunk,
    VectorStoreIndex,
    VectorStoreItem,
    VectorStoreSummaryResponse,
)


class VectorStoreService:
    """Store chunk embeddings in local JSON files for the MVP indexing stage."""

    def __init__(self, store_dir: Path | None = None) -> None:
        self.store_dir = store_dir or settings.vector_store_dir

    def save_file_vectors(
        self,
        file_id: str,
        client_id: str,
        chunks: list[DocumentChunk],
        vectors: list[list[float]],
        embedding_model: str,
    ) -> VectorStoreSummaryResponse:
        try:
            if not chunks:
                raise VectorStoreError("Cannot store vectors without chunks")
            if len(chunks) != len(vectors):
                raise VectorStoreError("Chunk count and vector count do not match")

            embedding_dimension = self._validate_vectors(vectors)
            created_at = datetime.now(timezone.utc).isoformat()
            items = [
                VectorStoreItem(
                    chunk_id=chunk.chunk_id,
                    file_id=chunk.file_id,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    char_count=chunk.char_count,
                    section_title=chunk.section_title,
                    section_path=chunk.section_path,
                    embedding=vectors[index],
                )
                for index, chunk in enumerate(chunks)
            ]
            index = VectorStoreIndex(
                file_id=file_id,
                status="stored",
                embedding_model=embedding_model,
                embedding_dimension=embedding_dimension,
                chunk_count=len(chunks),
                embedding_count=len(vectors),
                created_at=created_at,
                items=items,
            )

            self.store_dir.mkdir(parents=True, exist_ok=True)
            storage_path = self._index_path(file_id)
            storage_path.write_text(
                json.dumps(index.model_dump(), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            result = self._build_summary(index, storage_path)
            with SessionLocal() as db:
                FileRepository(db).update_indexed(
                    file_id,
                    client_id,
                    chunk_count=result.chunk_count,
                    embedding_count=result.embedding_count,
                    embedding_dimension=result.embedding_dimension,
                    embedding_model=result.embedding_model,
                    vector_store_path=result.storage_path,
                )
            return result
        except OSError as exc:
            self._mark_failed(file_id, client_id, "Failed to write vector store index")
            raise VectorStoreError("Failed to write vector store index") from exc
        except Exception as exc:
            self._mark_failed(file_id, client_id, str(exc))
            raise

    def get_file_vector_summary(self, file_id: str, client_id: str) -> VectorStoreSummaryResponse:
        index = self.load_file_vectors(file_id, client_id)
        return self._build_summary(index, self._index_path(file_id))

    def load_file_vectors(self, file_id: str, client_id: str | None = None) -> VectorStoreIndex:
        if client_id is not None:
            self._ensure_file_owned(file_id, client_id)
        storage_path = self._index_path(file_id)
        if not storage_path.exists() or not storage_path.is_file():
            raise VectorStoreNotFoundError()

        try:
            data = json.loads(storage_path.read_text(encoding="utf-8"))
            return VectorStoreIndex.model_validate(data)
        except json.JSONDecodeError as exc:
            raise VectorStoreError("Vector store index is not valid JSON") from exc
        except OSError as exc:
            raise VectorStoreError("Failed to read vector store index") from exc

    def exists(self, file_id: str) -> bool:
        return self._index_path(file_id).is_file()

    def _index_path(self, file_id: str) -> Path:
        return self.store_dir / f"{file_id}.json"

    def _validate_vectors(self, vectors: list[list[float]]) -> int:
        if not vectors or not vectors[0]:
            raise VectorStoreError("Cannot store empty vectors")

        dimension = len(vectors[0])
        if any(len(vector) != dimension for vector in vectors):
            raise VectorStoreError("Vector dimensions are inconsistent")

        return dimension

    def _build_summary(
        self, index: VectorStoreIndex, storage_path: Path
    ) -> VectorStoreSummaryResponse:
        return VectorStoreSummaryResponse(
            file_id=index.file_id,
            status=index.status,
            chunk_count=index.chunk_count,
            embedding_count=index.embedding_count,
            embedding_dimension=index.embedding_dimension,
            embedding_model=index.embedding_model,
            storage_path=self._display_storage_path(storage_path),
            created_at=index.created_at,
        )

    def _display_storage_path(self, storage_path: Path) -> str:
        try:
            return str(storage_path.relative_to(settings.backend_dir))
        except ValueError:
            return str(storage_path)

    def _ensure_file_owned(self, file_id: str, client_id: str) -> None:
        with SessionLocal() as db:
            if FileRepository(db).get_file(file_id, client_id) is None:
                raise VectorStoreNotFoundError()

    def _mark_failed(self, file_id: str, client_id: str, error_message: str) -> None:
        try:
            with SessionLocal() as db:
                FileRepository(db).touch_failed(file_id, client_id, error_message)
        except Exception:
            pass
