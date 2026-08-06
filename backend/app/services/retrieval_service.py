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

    capability_boost = 0.05
    overview_summary_boost = 0.07
    section_penalty_value = 0.04
    answerability_bonus_value = 0.05
    short_chunk_penalty_value = 0.06
    short_chunk_char_limit = 80
    evidence_fact_bonus_value = 0.03
    evidence_body_bonus_value = 0.02
    evidence_summary_bonus_value = 0.03
    evidence_title_penalty_value = 0.10
    evidence_thin_penalty_value = 0.04
    evidence_noise_penalty_value = 0.04

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

        query_intent = self._classify_query_intent(normalized_query)
        query_keywords = self._extract_keywords(normalized_query)
        scored_results = [
            self._score_item(query_vector, item, query_keywords, query_intent)
            for item in index.items
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
        query_intent: str,
    ) -> RetrievalResult:
        raw_score = round(self._cosine_similarity(query_vector, item.embedding), 6)
        keyword_bonus = self._keyword_bonus(item, query_keywords)
        section_boost, section_penalty, section_reason = self._section_adjustment(
            item, query_intent
        )
        length_penalty, length_reason = self._length_penalty(item)
        answerability_bonus, answerability_reason = self._answerability_bonus(
            item, query_intent
        )
        evidence_score, evidence_level, evidence_reason = self._evidence_adjustment(
            item, query_intent
        )
        final_score = round(
            min(
                max(
                    raw_score
                    + keyword_bonus
                    + section_boost
                    + answerability_bonus
                    + evidence_score
                    - section_penalty
                    - length_penalty,
                    0,
                ),
                1.0,
            ),
            6,
        )
        ranking_reason = [
            reason
            for reason in [
                f"intent:{query_intent}",
                "keyword_bonus" if keyword_bonus > 0 else "",
                section_reason,
                length_reason,
                answerability_reason,
                ";".join(evidence_reason),
            ]
            if reason
        ]

        return RetrievalResult(
            chunk_id=item.chunk_id,
            chunk_index=item.chunk_index,
            content=item.content,
            char_count=item.char_count,
            # Keep score as the compatibility field used by existing UI and RAG prompt.
            score=final_score,
            section_title=item.section_title,
            section_path=item.section_path,
            chunk_type=item.chunk_type,
            raw_score=raw_score,
            keyword_bonus=keyword_bonus,
            final_score=final_score,
            relevance_level=self._relevance_level(final_score),
            query_intent=query_intent,
            section_boost=section_boost,
            section_penalty=section_penalty,
            length_penalty=length_penalty,
            answerability_bonus=answerability_bonus,
            evidence_score=evidence_score,
            evidence_level=evidence_level,
            evidence_reason=evidence_reason,
            ranking_reason=ranking_reason,
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

        searchable = self._item_search_text(item)
        matched_count = sum(1 for keyword in query_keywords if keyword in searchable)
        if matched_count == 0:
            return 0

        match_ratio = matched_count / len(query_keywords)
        return round(settings.rag_keyword_bonus_max * match_ratio, 6)

    def _classify_query_intent(self, query: str) -> str:
        normalized = query.lower()
        if self._contains_any(
            normalized,
            [
                "\u603b\u7ed3",
                "\u6982\u89c8",
                "\u8fdb\u5c55",
                "\u73b0\u72b6",
                "\u6838\u5fc3\u80fd\u529b",
                "\u5b8c\u6210\u4e86\u54ea\u4e9b",
                "\u6709\u54ea\u4e9b\u529f\u80fd",
                "\u80fd\u505a\u4ec0\u4e48",
                "\u53ef\u4ee5\u505a\u4ec0\u4e48",
            ],
        ):
            return "overview"
        if self._contains_any(
            normalized,
            [
                "\u591a\u5c11",
                "\u51e0\u4eba",
                "\u4eba\u6570",
                "\u6570\u91cf",
                "\u4e0a\u9650",
                "\u5927\u5c0f",
                "\u591a\u5927",
                "mb",
                "gb",
            ],
        ):
            return "quantity"
        if self._contains_any(
            normalized,
            [
                "\u9650\u5236",
                "\u98ce\u9669",
                "\u4e0d\u652f\u6301",
                "\u7f3a\u9677",
                "\u95ee\u9898",
                "\u5931\u8d25",
            ],
        ):
            return "limit"
        if self._contains_any(
            normalized,
            [
                "\u670d\u52a1\u5668",
                "\u90e8\u7f72",
                "\u914d\u7f6e",
                "nginx",
                "systemd",
                "vps",
                "sqlite",
                "https",
                "\u57df\u540d",
            ],
        ):
            return "deployment"
        if self._contains_any(
            normalized,
            [
                "\u600e\u4e48",
                "\u5982\u4f55",
                "\u6d41\u7a0b",
                "\u6b65\u9aa4",
                "\u4f7f\u7528",
                "\u64cd\u4f5c",
                "\u4e0a\u4f20\u540e",
            ],
        ):
            return "usage"
        if self._contains_any(
            normalized,
            [
                "\u529f\u80fd",
                "\u80fd\u529b",
                "\u6838\u5fc3",
                "\u5b8c\u6210",
                "\u652f\u6301",
                "\u53ef\u4ee5",
                "\u6587\u4ef6\u7c7b\u578b",
                "\u4e0a\u4f20",
                "\u80fd\u505a",
            ],
        ):
            return "capability"
        return "general"

    def _section_adjustment(
        self, item: VectorStoreItem, query_intent: str
    ) -> tuple[float, float, str]:
        section = self._item_section_text(item)
        boost = 0.0
        penalty = 0.0
        reasons: list[str] = []

        if query_intent in {"capability", "quantity", "usage"} and self._contains_any(
            section,
            [
                "\u5df2\u5b8c\u6210\u529f\u80fd",
                "\u529f\u80fd",
                "\u6587\u4ef6\u4e0a\u4f20",
                "\u81ea\u52a8\u5904\u7406",
                "\u666e\u901a ai \u804a\u5929",
                "\u5355\u6587\u4ef6 rag",
            ],
        ):
            boost = self.capability_boost
            reasons.append("section_boost:capability")

        if query_intent == "overview" and item.chunk_type == "section_summary":
            boost = max(boost, self.overview_summary_boost)
            reasons.append("section_boost:overview_summary")

        if query_intent == "overview" and self._contains_any(
            section,
            [
                "\u5df2\u5b8c\u6210\u529f\u80fd",
                "\u529f\u80fd",
                "\u9879\u76ee\u80cc\u666f",
                "\u8bd5\u8fd0\u884c\u8303\u56f4",
            ],
        ):
            boost = max(boost, self.capability_boost)
            reasons.append("section_boost:overview_section")

        if query_intent == "limit" and self._contains_any(
            section, ["\u9650\u5236", "\u98ce\u9669", "\u4e0d\u652f\u6301"]
        ):
            boost = self.capability_boost
            reasons.append("section_boost:limit")

        if query_intent == "deployment" and self._contains_any(
            section, ["\u914d\u7f6e", "\u90e8\u7f72", "\u670d\u52a1\u5668", "vps", "nginx"]
        ):
            boost = self.capability_boost
            reasons.append("section_boost:deployment")

        noisy_for_intent = {
            "capability": ["\u5f53\u524d\u914d\u7f6e", "rag \u8d28\u91cf", "\u9650\u5236", "\u98ce\u9669"],
            "quantity": ["rag \u8d28\u91cf", "\u5f53\u524d\u914d\u7f6e"],
            "usage": ["rag \u8d28\u91cf", "\u5f53\u524d\u914d\u7f6e"],
            "deployment": ["rag \u8d28\u91cf"],
            "overview": ["\u5f53\u524d\u914d\u7f6e", "rag \u8d28\u91cf", "\u9650\u5236", "\u98ce\u9669"],
        }
        if self._contains_any(section, noisy_for_intent.get(query_intent, [])):
            penalty = self.section_penalty_value
            reasons.append("section_penalty:noise")

        return round(boost, 6), round(penalty, 6), ";".join(reasons)

    def _length_penalty(self, item: VectorStoreItem) -> tuple[float, str]:
        if item.char_count >= self.short_chunk_char_limit:
            return 0.0, ""

        content = item.content.strip()
        if "\n" not in content and not self._contains_any(content, ["\u3002", ".", "\uff1a", ":"]):
            return self.short_chunk_penalty_value, "length_penalty:short_title_like"

        return round(self.short_chunk_penalty_value / 2, 6), "length_penalty:short_chunk"

    def _answerability_bonus(self, item: VectorStoreItem, query_intent: str) -> tuple[float, str]:
        if query_intent != "quantity":
            return 0.0, ""

        searchable = self._item_search_text(item)
        if re.search(r"\d+\s*(mb|gb|kb|m|g|\u4eba|\u4e2a|\u6b21|\u6761)?", searchable, re.I):
            return self.answerability_bonus_value, "answerability_bonus:number_or_unit"
        return 0.0, ""

    def _evidence_adjustment(
        self, item: VectorStoreItem, query_intent: str
    ) -> tuple[float, str, list[str]]:
        score = 0.0
        reasons: list[str] = []
        searchable = self._item_search_text(item)

        if self._is_title_only_chunk(item):
            score -= self.evidence_title_penalty_value
            reasons.append("evidence_penalty:title_only")

        if item.chunk_type == "section_summary" and query_intent == "overview":
            score += self.evidence_summary_bonus_value
            reasons.append("evidence_bonus:overview_summary")

        if item.char_count >= self.short_chunk_char_limit and item.chunk_type == "normal":
            score += self.evidence_body_bonus_value
            reasons.append("evidence_bonus:body_length")

        if self._has_explicit_fact(searchable):
            score += self.evidence_fact_bonus_value
            reasons.append("evidence_bonus:explicit_fact")

        if not self._has_explanatory_signal(item.content) and item.chunk_type != "section_summary":
            score -= self.evidence_thin_penalty_value
            reasons.append("evidence_penalty:thin_content")

        if self._is_noise_for_intent(searchable, query_intent):
            score -= self.evidence_noise_penalty_value
            reasons.append("evidence_penalty:intent_noise")

        rounded_score = round(score, 6)
        return rounded_score, self._evidence_level(item, rounded_score), reasons

    def _is_title_only_chunk(self, item: VectorStoreItem) -> bool:
        content = item.content.strip()
        if item.chunk_type == "section_summary":
            return False
        if item.char_count > 60:
            return False
        if "\n" in content:
            return False
        if self._has_explicit_fact(content):
            return False
        if self._has_explanatory_signal(content):
            return False
        return True

    def _has_explicit_fact(self, text: str) -> bool:
        normalized = text.lower()
        return bool(
            re.search(r"\d+\s*(mb|gb|kb|m|g|\u4eba|\u4e2a|\u6b21|\u6761)?", normalized, re.I)
            or self._contains_any(
                normalized,
                [
                    "txt",
                    "docx",
                    "pdf",
                    "sqlite",
                    "nginx",
                    "fastapi",
                    "vps",
                    "embedding",
                    "vectorstore",
                    "rag",
                    "\u652f\u6301",
                    "\u4e0d\u652f\u6301",
                    "\u53ef\u4ee5",
                    "\u6682\u4e0d",
                    "\u5df2\u5b8c\u6210",
                    "\u4e0a\u9650",
                    "\u4e0a\u4f20",
                    "\u89e3\u6790",
                    "\u5207\u5757",
                    "\u5411\u91cf",
                    "\u7d22\u5f15",
                    "\u90e8\u7f72",
                    "\u4fdd\u5b58",
                ],
            )
        )

    def _has_explanatory_signal(self, text: str) -> bool:
        return self._contains_any(
            text,
            ["\u3002", "\uff1a", ":", "\uff1b", ";", "\uff0c", ",", "\n", "-", "|"],
        )

    def _is_noise_for_intent(self, text: str, query_intent: str) -> bool:
        if query_intent != "deployment" and self._contains_any(
            text, ["\u5f53\u524d\u914d\u7f6e", "\u670d\u52a1\u5668 |", "\u78c1\u76d8 |"]
        ):
            return True
        if query_intent not in {"general", "overview"} and self._contains_any(
            text, ["rag \u8d28\u91cf\u89c2\u5bdf\u6307\u6807", "retrieval hit rate", "citation precision"]
        ):
            return True
        return False

    def _evidence_level(self, item: VectorStoreItem, evidence_score: float) -> str:
        if self._is_title_only_chunk(item) or evidence_score < -0.03:
            return "weak"
        if evidence_score >= 0.04:
            return "strong"
        return "medium"

    def _contains_any(self, text: str, candidates: list[str]) -> bool:
        lowered = text.lower()
        return any(candidate.lower() in lowered for candidate in candidates)

    def _item_section_text(self, item: VectorStoreItem) -> str:
        return " ".join(value for value in [item.section_path, item.section_title] if value).lower()

    def _item_search_text(self, item: VectorStoreItem) -> str:
        return "\n".join(
            value
            for value in [item.section_path, item.section_title, item.content]
            if value
        ).lower()

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
            "\u4ec0\u4e48",
            "\u591a\u5c11",
            "\u54ea\u4e9b",
            "\u5982\u4f55",
            "\u662f\u5426",
            "\u4e00\u4e2a",
            "\u8fd9\u4e2a",
            "\u90a3\u4e2a",
            "\u76ee\u524d",
            "\u5f53\u524d",
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
