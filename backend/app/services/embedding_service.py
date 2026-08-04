from app.core.config import settings
from app.core.errors import EmbeddingConfigError, EmbeddingProviderError
from app.db.database import SessionLocal
from app.embedding.base import EmbeddingProvider
from app.embedding.mock_provider import MockEmbeddingProvider
from app.embedding.openai_provider import OpenAIEmbeddingProvider
from app.repositories.file_repository import FileRepository
from app.schemas.file import DocumentChunk, EmbedFileResponse, EmbeddingPreview


class EmbeddingService:
    preview_limit = 3
    vector_preview_limit = 3

    def __init__(self, provider: EmbeddingProvider | None = None) -> None:
        self.provider = provider or self._create_provider()

    def embed_chunks(
        self, file_id: str, chunks: list[DocumentChunk], client_id: str
    ) -> EmbedFileResponse:
        try:
            if not chunks:
                raise EmbeddingProviderError("No chunks provided for embedding")

            vectors = self.embed_chunk_vectors(chunks)
            dimension = self._validate_vectors(vectors)
            with SessionLocal() as db:
                FileRepository(db).update_embedded(
                    file_id,
                    client_id,
                    chunk_count=len(chunks),
                    embedding_count=len(vectors),
                    embedding_dimension=dimension,
                    embedding_model=settings.embedding_model,
                )
            previews = [
                EmbeddingPreview(
                    chunk_id=chunk.chunk_id,
                    chunk_index=chunk.chunk_index,
                    vector_preview=vectors[index][: self.vector_preview_limit],
                )
                for index, chunk in enumerate(chunks[: self.preview_limit])
            ]

            return EmbedFileResponse(
                file_id=file_id,
                status="embedded",
                chunk_count=len(chunks),
                embedding_count=len(vectors),
                embedding_dimension=dimension,
                embedding_preview=previews,
            )
        except Exception as exc:
            self._mark_failed(file_id, client_id, str(exc))
            raise

    def embed_chunk_vectors(self, chunks: list[DocumentChunk]) -> list[list[float]]:
        if not chunks:
            raise EmbeddingProviderError("No chunks provided for embedding")

        vectors = self.provider.embed_texts([chunk.content for chunk in chunks])
        if len(vectors) != len(chunks):
            raise EmbeddingProviderError("Embedding provider returned an unexpected vector count")

        self._validate_vectors(vectors)
        return vectors

    def embed_file_vectors(
        self, file_id: str, chunks: list[DocumentChunk], client_id: str | None = None
    ) -> list[list[float]]:
        try:
            return self.embed_chunk_vectors(chunks)
        except Exception as exc:
            if client_id is not None:
                self._mark_failed(file_id, client_id, str(exc))
            raise

    def _create_provider(self) -> EmbeddingProvider:
        if settings.embedding_provider == "mock":
            return MockEmbeddingProvider(settings.embedding_dimension)
        if settings.embedding_provider == "openai":
            return OpenAIEmbeddingProvider()
        raise EmbeddingConfigError(f"Unsupported embedding provider: {settings.embedding_provider}")

    def _validate_vectors(self, vectors: list[list[float]]) -> int:
        if not vectors or not vectors[0]:
            raise EmbeddingProviderError("Embedding provider returned empty vectors")

        dimension = len(vectors[0])
        if any(len(vector) != dimension for vector in vectors):
            raise EmbeddingProviderError("Embedding provider returned inconsistent vector dimensions")

        return dimension

    def _mark_failed(self, file_id: str, client_id: str, error_message: str) -> None:
        try:
            with SessionLocal() as db:
                FileRepository(db).touch_failed(file_id, client_id, error_message)
        except Exception:
            pass
