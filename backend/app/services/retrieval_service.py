import re
from math import sqrt

from app.core.config import settings
from app.core.errors import RetrievalError
from app.embedding.base import EmbeddingProvider
from app.schemas.file import RetrievalResult, RetrieveFileResponse, VectorStoreItem
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

    def retrieve(
        self, file_id: str, query: str, top_k: int = 3, client_id: str | None = None
    ) -> RetrieveFileResponse:
        normalized_query = query.strip()
        if not normalized_query:
            raise RetrievalError("Query is required")

        index = self.vector_store_service.load_file_vectors(file_id, client_id)
        query_vector = self.embedding_service.provider.embed_texts([normalized_query])[0]
        if len(query_vector) != index.embedding_dimension:
            raise RetrievalError("Query vector dimension does not match stored vectors")

        query_keywords = self._extract_keywords(normalized_query)
        scored_results = [
            self._score_item(query_vector, item, query_keywords) for item in index.items
        ]
        ranked_results = sorted(
            scored_results,
            key=lambda result: (-self._result_score(result), result.chunk_index),
        )
        filtered_results = self._filter_results(ranked_results)[:top_k]
        if not filtered_results and ranked_results:
            filtered_results = ranked_results[:1]
        scores = [result.score for result in filtered_results]

        return RetrieveFileResponse(
            file_id=file_id,
            query=normalized_query,
            top_k=top_k,
            result_count=len(filtered_results),
            results=filtered_results,
            max_score=max(scores) if scores else None,
            min_score=min(scores) if scores else None,
            average_score=round(sum(scores) / len(scores), 6) if scores else None,
        )

    def _score_item(
        self,
        query_vector: list[float],
        item: VectorStoreItem,
        query_keywords: set[str],
    ) -> RetrievalResult:
        raw_score = round(self._cosine_similarity(query_vector, item.embedding), 6)
        keyword_bonus = self._keyword_bonus(item, query_keywords)
        final_score = round(min(raw_score + keyword_bonus, 1.0), 6)

        return RetrievalResult(
            chunk_id=item.chunk_id,
            chunk_index=item.chunk_index,
            content=item.content,
            char_count=item.char_count,
            # Keep score as the compatibility field used by existing UI and RAG prompt.
            score=final_score,
            section_title=item.section_title,
            section_path=item.section_path,
            raw_score=raw_score,
            keyword_bonus=keyword_bonus,
            final_score=final_score,
            relevance_level=self._relevance_level(final_score),
        )

    def _filter_results(self, ranked_results: list[RetrievalResult]) -> list[RetrievalResult]:
        if not ranked_results:
            return []

        max_score = self._result_score(ranked_results[0])
        relative_cutoff = max_score - settings.rag_relative_score_gap
        cutoff = max(settings.rag_score_threshold, relative_cutoff)
        return [result for result in ranked_results if self._result_score(result) >= cutoff]

    def _result_score(self, result: RetrievalResult) -> float:
        return result.final_score if result.final_score is not None else result.score

    def _keyword_bonus(self, item: VectorStoreItem, query_keywords: set[str]) -> float:
        if not query_keywords or settings.rag_keyword_bonus_max <= 0:
            return 0

        searchable = "\n".join(
            value
            for value in [item.section_path, item.section_title, item.content]
            if value
        ).lower()
        matched_count = sum(1 for keyword in query_keywords if keyword in searchable)
        if matched_count == 0:
            return 0

        match_ratio = matched_count / len(query_keywords)
        return round(settings.rag_keyword_bonus_max * match_ratio, 6)

    def _extract_keywords(self, query: str) -> set[str]:
        normalized = query.lower()
        keywords = {token for token in re.findall(r"[a-z0-9_]{2,}", normalized)}

        cjk_runs = re.findall(r"[\u4e00-\u9fff]{2,}", normalized)
        for run in cjk_runs:
            keywords.update(self._cjk_ngrams(run))

        return {keyword for keyword in keywords if keyword not in self._stop_keywords()}

    def _cjk_ngrams(self, text: str) -> set[str]:
        ngrams: set[str] = set()
        max_size = min(4, len(text))
        for size in range(2, max_size + 1):
            for start in range(0, len(text) - size + 1):
                ngrams.add(text[start : start + size])
        return ngrams

    def _stop_keywords(self) -> set[str]:
        return {
            "什么",
            "多少",
            "哪些",
            "如何",
            "是否",
            "一个",
            "这个",
            "那个",
            "目前",
            "当前",
        }

    def _relevance_level(self, score: float) -> str:
        if score >= 0.65:
            return "high"
        if score >= 0.50:
            return "medium"
        return "weak"

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
