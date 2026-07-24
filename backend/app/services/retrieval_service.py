from math import sqrt

from app.core.errors import RetrievalError
from app.embedding.base import EmbeddingProvider
from app.schemas.file import RetrievalResult, RetrieveFileResponse
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService


class RetrievalService:
    """Retrieve top-k chunks from a stored local vector index."""

    def __init__(
        self,
        embedding_provider: EmbeddingProvider | None = None,
        vector_store_service: VectorStoreService | None = None,
    ) -> None:
        self.embedding_service = EmbeddingService(provider=embedding_provider)
        self.vector_store_service = vector_store_service or VectorStoreService()

    def retrieve(self, file_id: str, query: str, top_k: int = 3) -> RetrieveFileResponse:
        normalized_query = query.strip()
        if not normalized_query:
            raise RetrievalError("Query is required")

        index = self.vector_store_service.load_file_vectors(file_id)
        query_vector = self.embedding_service.provider.embed_texts([normalized_query])[0]
        if len(query_vector) != index.embedding_dimension:
            raise RetrievalError("Query vector dimension does not match stored vectors")

        scored_results = [
            RetrievalResult(
                chunk_id=item.chunk_id,
                chunk_index=item.chunk_index,
                content=item.content,
                char_count=item.char_count,
                score=round(self._cosine_similarity(query_vector, item.embedding), 6),
            )
            for item in index.items
        ]
        ranked_results = sorted(
            scored_results,
            key=lambda result: (-result.score, result.chunk_index),
        )[:top_k]

        return RetrieveFileResponse(
            file_id=file_id,
            query=normalized_query,
            top_k=top_k,
            result_count=len(ranked_results),
            results=ranked_results,
        )

    def _cosine_similarity(self, a: list[float], b: list[float]) -> float:
        if len(a) != len(b):
            raise RetrievalError("Vector dimensions are inconsistent")
        if not a:
            raise RetrievalError("Cannot compare empty vectors")

        norm_a = sqrt(sum(value * value for value in a))
        norm_b = sqrt(sum(value * value for value in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0

        dot_product = sum(left * right for left, right in zip(a, b))
        return dot_product / (norm_a * norm_b)
