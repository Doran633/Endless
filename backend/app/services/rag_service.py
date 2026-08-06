from uuid import uuid4

from app.core.config import settings
from app.core.errors import RagError
from app.llm.base import ChatMessage
from app.schemas.file import AskFileResponse, RagDebugTrace, RetrievalResult
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalService


class RagService:
    """Answer questions from one indexed file using retrieval context and an LLM."""

    no_answer_text = "\u6839\u636e\u5f53\u524d\u6587\u6863\u5185\u5bb9\u65e0\u6cd5\u786e\u8ba4\u3002"
    no_answer_score_threshold = 0.45
    low_confidence_score_threshold = 0.55

    def __init__(
        self,
        retrieval_service: RetrievalService | None = None,
        llm_service: LLMService | None = None,
    ) -> None:
        self.retrieval_service = retrieval_service or RetrievalService()
        self.llm_service = llm_service or LLMService()

    def ask_file(
        self,
        file_id: str,
        query: str,
        top_k: int = 3,
        conversation_context: list[ChatMessage] | None = None,
        client_id: str | None = None,
    ) -> AskFileResponse:
        normalized_query = query.strip()
        if not normalized_query:
            raise RagError("Question is required")

        retrieval = self.retrieval_service.retrieve(
            file_id, normalized_query, top_k, client_id
        )
        if not retrieval.results:
            return self._no_answer_response(
                file_id=file_id,
                query=normalized_query,
                top_k=top_k,
                chunks=[],
                reason="empty_retrieval",
            )

        evidence_chunks = self._select_evidence_chunks(retrieval.results)
        if not evidence_chunks:
            return self._no_answer_response(
                file_id=file_id,
                query=normalized_query,
                top_k=top_k,
                chunks=retrieval.results,
                reason="weak_evidence",
            )

        answer_policy, no_answer_reason = self._decide_answer_policy(evidence_chunks)
        if answer_policy == "no_answer":
            return self._no_answer_response(
                file_id=file_id,
                query=normalized_query,
                top_k=top_k,
                chunks=evidence_chunks,
                reason=no_answer_reason or "low_score",
            )

        prompt = self._build_prompt(
            normalized_query,
            evidence_chunks,
            conversation_context or [],
            answer_policy,
        )
        response = self.llm_service.chat(
            [
                ChatMessage(
                    role="system",
                    content=(
                        "You are Beichen Agent, a careful document question-answering "
                        "assistant. Answer only from the provided document chunks. "
                        "If the chunks do not contain enough evidence, say that the "
                        "current document cannot confirm the answer."
                    ),
                ),
                ChatMessage(role="user", content=prompt),
            ]
        )
        model_no_answer = self._is_no_answer(response.content)
        final_policy = "no_answer" if model_no_answer else answer_policy
        final_reason = "model_refusal" if model_no_answer else no_answer_reason
        debug_trace = self._build_debug_trace(
            file_id=file_id,
            query=normalized_query,
            top_k=top_k,
            chunks=evidence_chunks,
            model=response.model,
            input_tokens=response.input_tokens,
            output_tokens=response.output_tokens,
            no_answer=model_no_answer,
            answer_policy=final_policy,
            no_answer_reason=final_reason,
        )

        return AskFileResponse(
            file_id=file_id,
            query=normalized_query,
            answer=response.content,
            top_k=top_k,
            used_chunk_count=len(evidence_chunks),
            used_chunks=evidence_chunks,
            provider=settings.llm_provider,
            model=response.model,
            usage={
                "input_tokens": response.input_tokens,
                "output_tokens": response.output_tokens,
            },
            debug_trace=debug_trace,
            answer_policy=final_policy,
            no_answer_reason=final_reason,
        )

    def _no_answer_response(
        self,
        *,
        file_id: str,
        query: str,
        top_k: int,
        chunks: list[RetrievalResult],
        reason: str,
    ) -> AskFileResponse:
        debug_trace = self._build_debug_trace(
            file_id=file_id,
            query=query,
            top_k=top_k,
            chunks=chunks,
            model=settings.llm_model,
            input_tokens=0,
            output_tokens=0,
            no_answer=True,
            answer_policy="no_answer",
            no_answer_reason=reason,
        )
        return AskFileResponse(
            file_id=file_id,
            query=query,
            answer=self.no_answer_text,
            top_k=top_k,
            used_chunk_count=len(chunks),
            used_chunks=chunks,
            provider=settings.llm_provider,
            model=settings.llm_model,
            usage={"input_tokens": 0, "output_tokens": 0},
            debug_trace=debug_trace,
            answer_policy="no_answer",
            no_answer_reason=reason,
        )

    def _decide_answer_policy(self, chunks: list[RetrievalResult]) -> tuple[str, str | None]:
        if not chunks:
            return "no_answer", "empty_retrieval"

        scores = [chunk.score for chunk in chunks]
        max_score = max(scores)
        if max_score < self.no_answer_score_threshold:
            return "no_answer", "low_score"

        if all(chunk.relevance_level == "weak" for chunk in chunks):
            return "low_confidence_answer", "weak_chunks"

        if max_score < self.low_confidence_score_threshold:
            return "low_confidence_answer", "low_score"

        return "grounded_answer", None

    def _select_evidence_chunks(self, chunks: list[RetrievalResult]) -> list[RetrievalResult]:
        return [chunk for chunk in chunks if chunk.evidence_level in {"strong", "medium"}]

    def _build_debug_trace(
        self,
        *,
        file_id: str,
        query: str,
        top_k: int,
        chunks: list[RetrievalResult],
        model: str,
        input_tokens: int | None,
        output_tokens: int | None,
        no_answer: bool,
        answer_policy: str,
        no_answer_reason: str | None,
    ) -> RagDebugTrace:
        scores = [chunk.score for chunk in chunks]
        max_score = max(scores) if scores else None
        min_score = min(scores) if scores else None
        average_score = round(sum(scores) / len(scores), 6) if scores else None

        return RagDebugTrace(
            trace_id=str(uuid4()),
            file_id=file_id,
            query=query,
            top_k=top_k,
            retrieved_count=len(chunks),
            max_score=max_score,
            min_score=min_score,
            average_score=average_score,
            used_chunk_ids=[chunk.chunk_id for chunk in chunks],
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            confidence=self._classify_confidence(max_score),
            no_answer=no_answer,
            answer_policy=answer_policy,
            no_answer_reason=no_answer_reason,
        )

    def _classify_confidence(self, max_score: float | None) -> str:
        if max_score is None:
            return "low"
        if max_score >= 0.65:
            return "high"
        if max_score >= 0.45:
            return "medium"
        return "low"

    def _is_no_answer(self, answer: str) -> bool:
        return (
            "\u65e0\u6cd5\u786e\u8ba4" in answer
            or "\u672a\u627e\u5230" in answer
            or "\u6ca1\u6709\u8db3\u591f" in answer
        )

    def _build_prompt(
        self,
        query: str,
        chunks: list[RetrievalResult],
        conversation_context: list[ChatMessage] | None,
        answer_policy: str,
    ) -> str:
        context_blocks = []
        for index, chunk in enumerate(chunks, start=1):
            section_label = f" | section={chunk.section_path}" if chunk.section_path else ""
            type_label = f" | type={chunk.chunk_type}" if chunk.chunk_type else ""
            context_blocks.append(
                "\n".join(
                    [
                        (
                            f"[Chunk {index} | chunk_index={chunk.chunk_index} "
                            f"| score={chunk.score}{type_label}{section_label}]"
                        ),
                        chunk.content,
                    ]
                )
            )

        context = "\n\n".join(context_blocks)
        conversation = self._format_conversation_context(conversation_context or [])
        caution = (
            "\u672c\u6b21\u68c0\u7d22\u7f6e\u4fe1\u5ea6\u504f\u4f4e\uff0c"
            "\u5982\u679c\u7247\u6bb5\u4e0d\u80fd\u76f4\u63a5\u652f\u6491\u7b54\u6848\uff0c"
            "\u5fc5\u987b\u56de\u7b54\u201c\u6839\u636e\u5f53\u524d\u6587\u6863\u5185\u5bb9\u65e0\u6cd5\u786e\u8ba4\u201d\u3002\n"
            if answer_policy == "low_confidence_answer"
            else ""
        )
        return (
            "\u4f60\u662f\u5317\u8fb0agent\u7684\u6587\u6863\u95ee\u7b54\u6a21\u5757\u3002\n"
            "\u8bf7\u4e25\u683c\u9075\u5b88\u4ee5\u4e0b\u89c4\u5219\uff1a\n"
            "1. \u53ea\u80fd\u6839\u636e\u63d0\u4f9b\u7684\u6587\u6863 chunks \u56de\u7b54\u3002\n"
            "2. \u4e0d\u8981\u4f7f\u7528\u5916\u90e8\u5e38\u8bc6\u6216\u81ea\u884c\u731c\u6d4b\u8865\u5168\u7b54\u6848\u3002\n"
            "3. \u5982\u679c chunks \u4e0d\u8db3\u4ee5\u652f\u6491\u7b54\u6848\uff0c\u5fc5\u987b\u56de\u7b54"
            "\u201c\u6839\u636e\u5f53\u524d\u6587\u6863\u5185\u5bb9\u65e0\u6cd5\u786e\u8ba4\u201d\u3002\n"
            "4. \u5982\u679c\u80fd\u56de\u7b54\uff0c\u8bf7\u5c3d\u91cf\u6807\u6ce8\u4f9d\u636e\u6765\u81ea\u54ea\u4e9b Chunk\u3002\n"
            f"{caution}\n"
            f"\u6587\u6863 chunks\uff1a\n{context}\n\n"
            f"\u6700\u8fd1\u5bf9\u8bdd\u4e0a\u4e0b\u6587\uff1a\n{conversation}\n\n"
            f"\u5f53\u524d\u95ee\u9898\uff1a\n{query}\n\n"
            "\u8bf7\u7528\u4e2d\u6587\u56de\u7b54\uff0c\u4fdd\u6301\u7b80\u6d01\u3001\u51c6\u786e\u3001\u6709\u4f9d\u636e\u3002"
        )

    def _format_conversation_context(self, messages: list[ChatMessage]) -> str:
        if not messages:
            return "\u65e0"

        lines = []
        for message in messages:
            role = "\u7528\u6237" if message.role == "user" else "\u5317\u8fb0agent"
            lines.append(f"{role}: {message.content}")
        return "\n".join(lines)
