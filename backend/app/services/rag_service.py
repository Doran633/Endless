from uuid import uuid4

from app.core.config import settings
from app.core.errors import RagError
from app.llm.base import ChatMessage
from app.schemas.file import AskFileResponse, RagDebugTrace, RetrievalResult
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalService


class RagService:
    """Answer questions from one indexed file using retrieval context and an LLM."""

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
            raise RagError("No relevant chunks were found for this file")

        prompt = self._build_prompt(
            normalized_query,
            retrieval.results,
            conversation_context or [],
        )
        response = self.llm_service.chat(
            [
                ChatMessage(
                    role="system",
                    content=(
                        "You are Beichen Agent, a careful document question-answering "
                        "assistant. Answer only from the provided document chunks."
                    ),
                ),
                ChatMessage(role="user", content=prompt),
            ]
        )
        debug_trace = self._build_debug_trace(
            file_id=file_id,
            query=normalized_query,
            top_k=top_k,
            chunks=retrieval.results,
            model=response.model,
            input_tokens=response.input_tokens,
            output_tokens=response.output_tokens,
            no_answer=self._is_no_answer(response.content),
        )

        return AskFileResponse(
            file_id=file_id,
            query=normalized_query,
            answer=response.content,
            top_k=top_k,
            used_chunk_count=len(retrieval.results),
            used_chunks=retrieval.results,
            provider=settings.llm_provider,
            model=response.model,
            usage={
                "input_tokens": response.input_tokens,
                "output_tokens": response.output_tokens,
            },
            debug_trace=debug_trace,
        )

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
        return "无法确认" in answer or "未找到" in answer

    def _build_prompt(
        self,
        query: str,
        chunks: list[RetrievalResult],
        conversation_context: list[ChatMessage] | None = None,
    ) -> str:
        context_blocks = []
        for index, chunk in enumerate(chunks, start=1):
            # Keep the prompt format explicit so early RAG behavior is easy to inspect.
            context_blocks.append(
                "\n".join(
                    [
                        f"[Chunk {index} | chunk_index={chunk.chunk_index} | score={chunk.score}]",
                        chunk.content,
                    ]
                )
            )

        context = "\n\n".join(context_blocks)
        conversation = self._format_conversation_context(conversation_context or [])
        return (
            "请只根据下面提供的文档片段回答用户问题。\n"
            "如果文档片段中没有足够信息，请明确说明“根据当前文档内容无法确认”。\n"
            "不要编造文档中不存在的信息。\n\n"
            f"文档片段：\n{context}\n\n"
            f"最近对话上下文：\n{conversation}\n\n"
            f"当前问题：\n{query}\n\n"
            "请用中文回答，回答要简洁、准确，并尽量说明依据来自哪些片段。"
        )

    def _format_conversation_context(self, messages: list[ChatMessage]) -> str:
        if not messages:
            return "无"

        lines = []
        for message in messages:
            role = "用户" if message.role == "user" else "北辰agent"
            lines.append(f"{role}: {message.content}")
        return "\n".join(lines)
