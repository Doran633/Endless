import json
from uuid import uuid4

from sqlalchemy.exc import SQLAlchemyError

from app.core.errors import (
    ChatFileBindingError,
    ChatSessionNotFoundError,
    ChatSessionStorageError,
)
from app.db.database import SessionLocal
from app.db.models import ChatMessageRecord, ChatSessionRecord
from app.llm.base import ChatMessage
from app.repositories.chat_repository import ChatRepository
from app.repositories.file_repository import FileRepository
from app.schemas.chat import (
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatSessionListResponse,
    ChatSessionResponse,
    DeleteChatSessionResponse,
)
from app.schemas.file import AskFileResponse, RetrievalResult
from app.services.chat_service import ChatService
from app.services.rag_service import RagService


class ConversationService:
    DEFAULT_SESSION_TITLE = "新对话"
    MAX_AUTO_TITLE_LENGTH = 24
    DEFAULT_CONTEXT_MESSAGE_LIMIT = 6
    MAX_CONTEXT_MESSAGE_CHARS = 1200

    def answer_and_persist_chat(
        self, session_id: str, client_id: str, message: str
    ) -> dict[str, object]:
        self._ensure_session_exists(session_id, client_id)

        context_messages = self._build_chat_context_messages(session_id, client_id, message)
        result = ChatService().answer_with_context(context_messages)
        self._save_message(session_id=session_id, client_id=client_id, role="user", content=message)
        self._save_message(
            session_id=session_id,
            client_id=client_id,
            role="assistant",
            content=str(result["answer"]),
            metadata={
                "token_count": self._sum_token_count(result.get("usage")),
            },
        )
        self.maybe_update_session_title(session_id, client_id, message)
        return result

    def ask_file_and_persist(
        self,
        *,
        session_id: str,
        client_id: str,
        file_id: str,
        query: str,
        top_k: int,
    ) -> AskFileResponse:
        self._ensure_session_exists(session_id, client_id)
        rag_file_name = self._get_file_name(file_id, client_id)
        conversation_context = self._build_recent_context_messages(session_id, client_id)

        result = RagService().ask_file(
            file_id,
            query,
            top_k,
            conversation_context=conversation_context,
            client_id=client_id,
        )
        self._save_message(
            session_id=session_id,
            client_id=client_id,
            role="user",
            content=result.query,
        )
        self._save_message(
            session_id=session_id,
            client_id=client_id,
            role="assistant",
            content=result.answer,
            metadata=self._build_rag_metadata(result, rag_file_name),
        )
        self.maybe_update_session_title(session_id, client_id, result.query)
        return result

    def create_session(
        self, client_id: str, title: str = DEFAULT_SESSION_TITLE, mode: str = "chat"
    ) -> ChatSessionResponse:
        try:
            with SessionLocal() as db:
                record = ChatRepository(db).create_session(
                    client_id=client_id,
                    session_id=str(uuid4()),
                    title=title,
                    mode=mode,
                )
                return self._to_session_response(record)
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to create chat session") from exc

    def list_sessions(self, client_id: str) -> ChatSessionListResponse:
        try:
            with SessionLocal() as db:
                records = ChatRepository(db).list_sessions(client_id)
                return ChatSessionListResponse(
                    sessions=[self._to_session_response(record) for record in records]
                )
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to list chat sessions") from exc

    def get_messages(self, session_id: str, client_id: str) -> ChatMessageListResponse:
        try:
            with SessionLocal() as db:
                repository = ChatRepository(db)
                if repository.get_session(session_id, client_id) is None:
                    raise ChatSessionNotFoundError()
                records = repository.list_messages(session_id, client_id)
                return ChatMessageListResponse(
                    session_id=session_id,
                    messages=[self._to_message_response(record) for record in records],
                )
        except ChatSessionNotFoundError:
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to list chat messages") from exc

    def delete_session(self, session_id: str, client_id: str) -> DeleteChatSessionResponse:
        try:
            with SessionLocal() as db:
                repository = ChatRepository(db)
                if repository.get_session(session_id, client_id) is None:
                    raise ChatSessionNotFoundError()
                message_count = repository.delete_session(session_id, client_id)
                return DeleteChatSessionResponse(
                    session_id=session_id,
                    deleted=True,
                    message_count_deleted=message_count,
                )
        except ChatSessionNotFoundError:
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to delete chat session") from exc

    def bind_file(
        self, session_id: str, client_id: str, file_id: str | None
    ) -> ChatSessionResponse:
        try:
            with SessionLocal() as db:
                chat_repository = ChatRepository(db)
                if chat_repository.get_session(session_id, client_id) is None:
                    raise ChatSessionNotFoundError()

                if file_id is None:
                    if not chat_repository.clear_bound_file(session_id, client_id):
                        raise ChatSessionNotFoundError()
                else:
                    file_record = FileRepository(db).get_file(file_id, client_id)
                    if file_record is None:
                        raise ChatFileBindingError("Cannot bind a missing file")
                    if file_record.status != "indexed":
                        raise ChatFileBindingError("Only indexed files can be bound to a session")
                    if not chat_repository.update_bound_file(session_id, client_id, file_id):
                        raise ChatSessionNotFoundError()

                record = chat_repository.get_session(session_id, client_id)
                if record is None:
                    raise ChatSessionNotFoundError()
                return self._to_session_response(record)
        except (ChatFileBindingError, ChatSessionNotFoundError):
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to bind file to chat session") from exc

    def clear_file_binding_for_deleted_file(self, file_id: str, client_id: str) -> int:
        try:
            with SessionLocal() as db:
                return ChatRepository(db).clear_bound_file_for_file(file_id, client_id)
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to clear deleted file bindings") from exc

    def maybe_update_session_title(
        self, session_id: str, client_id: str, user_content: str
    ) -> None:
        auto_title = self._build_auto_title(user_content)
        if not auto_title:
            return

        try:
            with SessionLocal() as db:
                repository = ChatRepository(db)
                session = repository.get_session(session_id, client_id)
                if session is None:
                    raise ChatSessionNotFoundError()
                if session.title != self.DEFAULT_SESSION_TITLE:
                    return
                if not repository.update_session_title(session_id, client_id, auto_title):
                    raise ChatSessionNotFoundError()
        except ChatSessionNotFoundError:
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to update chat session title") from exc

    def _build_auto_title(self, content: str) -> str:
        normalized = " ".join(content.split())
        if not normalized:
            return ""
        if len(normalized) <= self.MAX_AUTO_TITLE_LENGTH:
            return normalized
        return f"{normalized[: self.MAX_AUTO_TITLE_LENGTH]}..."

    def _ensure_session_exists(self, session_id: str, client_id: str) -> None:
        try:
            with SessionLocal() as db:
                if ChatRepository(db).get_session(session_id, client_id) is None:
                    raise ChatSessionNotFoundError()
        except ChatSessionNotFoundError:
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to load chat session") from exc

    def _build_chat_context_messages(
        self, session_id: str, client_id: str, current_message: str
    ) -> list[ChatMessage]:
        messages = self._build_recent_context_messages(session_id, client_id)
        messages.append(ChatMessage(role="user", content=current_message))
        return messages

    def _build_recent_context_messages(self, session_id: str, client_id: str) -> list[ChatMessage]:
        try:
            with SessionLocal() as db:
                repository = ChatRepository(db)
                if repository.get_session(session_id, client_id) is None:
                    raise ChatSessionNotFoundError()
                records = repository.list_recent_messages(
                    session_id, client_id, self.DEFAULT_CONTEXT_MESSAGE_LIMIT
                )
        except ChatSessionNotFoundError:
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to load chat context") from exc

        return [
            self._to_context_message(record)
            for record in records
            if record.role in {"user", "assistant"} and record.content.strip()
        ]

    def _to_context_message(self, record: ChatMessageRecord) -> ChatMessage:
        return ChatMessage(
            role=record.role,
            content=self._truncate_context_content(record.content),
        )

    def _truncate_context_content(self, content: str) -> str:
        normalized = content.strip()
        if len(normalized) <= self.MAX_CONTEXT_MESSAGE_CHARS:
            return normalized
        return f"{normalized[: self.MAX_CONTEXT_MESSAGE_CHARS]}..."

    def _save_message(
        self,
        *,
        session_id: str,
        client_id: str,
        role: str,
        content: str,
        metadata: dict[str, object] | None = None,
    ) -> None:
        try:
            with SessionLocal() as db:
                repository = ChatRepository(db)
                if repository.get_session(session_id, client_id) is None:
                    raise ChatSessionNotFoundError()
                repository.create_message(
                    message_id=str(uuid4()),
                    session_id=session_id,
                    client_id=client_id,
                    role=role,
                    content=content,
                    metadata_json=self._dump_metadata(metadata),
                )
        except (ChatSessionNotFoundError, ValueError):
            raise ChatSessionNotFoundError()
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to save chat message") from exc

    def _get_file_name(self, file_id: str, client_id: str) -> str | None:
        try:
            with SessionLocal() as db:
                record = FileRepository(db).get_file(file_id, client_id)
                return record.original_name if record is not None else None
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to load RAG file metadata") from exc

    def _build_rag_metadata(
        self, result: AskFileResponse, rag_file_name: str | None
    ) -> dict[str, object]:
        return {
            "rag_file_id": result.file_id,
            "rag_file_name": rag_file_name,
            "used_chunks": [self._chunk_to_metadata(chunk) for chunk in result.used_chunks],
            "debug_trace": self._trace_to_metadata(result),
            "token_count": self._sum_token_count(result.usage),
        }

    def _trace_to_metadata(self, result: AskFileResponse) -> dict[str, object] | None:
        if result.debug_trace is None:
            return None

        trace = result.debug_trace
        return {
            "trace_id": trace.trace_id,
            "file_id": trace.file_id,
            "top_k": trace.top_k,
            "retrieved_count": trace.retrieved_count,
            "max_score": trace.max_score,
            "min_score": trace.min_score,
            "average_score": trace.average_score,
            "used_chunk_ids": trace.used_chunk_ids,
            "model": trace.model,
            "input_tokens": trace.input_tokens,
            "output_tokens": trace.output_tokens,
            "confidence": trace.confidence,
            "no_answer": trace.no_answer,
            "answer_policy": trace.answer_policy,
            "no_answer_reason": trace.no_answer_reason,
        }

    def _chunk_to_metadata(self, chunk: RetrievalResult) -> dict[str, object]:
        return {
            "chunk_id": chunk.chunk_id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "char_count": chunk.char_count,
            "score": chunk.score,
            "section_title": chunk.section_title,
            "section_path": chunk.section_path,
            "chunk_type": chunk.chunk_type,
            "raw_score": chunk.raw_score,
            "keyword_bonus": chunk.keyword_bonus,
            "final_score": chunk.final_score,
            "relevance_level": chunk.relevance_level,
            "query_intent": chunk.query_intent,
            "section_boost": chunk.section_boost,
            "section_penalty": chunk.section_penalty,
            "length_penalty": chunk.length_penalty,
            "answerability_bonus": chunk.answerability_bonus,
            "ranking_reason": chunk.ranking_reason,
        }

    def _dump_metadata(self, metadata: dict[str, object] | None) -> str | None:
        if metadata is None:
            return None
        return json.dumps(metadata, ensure_ascii=False)

    def _sum_token_count(self, usage: object) -> int | None:
        if not isinstance(usage, dict):
            return None
        values = [usage.get("input_tokens"), usage.get("output_tokens")]
        if not all(isinstance(value, int) for value in values):
            return None
        return int(sum(values))

    def _to_session_response(self, record: ChatSessionRecord) -> ChatSessionResponse:
        return ChatSessionResponse(
            id=record.id,
            title=record.title,
            mode=record.mode,
            bound_file_id=record.bound_file_id,
            created_at=record.created_at.isoformat(),
            updated_at=record.updated_at.isoformat(),
        )

    def _to_message_response(self, record: ChatMessageRecord) -> ChatMessageResponse:
        return ChatMessageResponse(
            id=record.id,
            session_id=record.session_id,
            role=record.role,
            content=record.content,
            metadata=self._parse_metadata(record.metadata_json),
            created_at=record.created_at.isoformat(),
        )

    def _parse_metadata(self, metadata_json: str | None) -> dict[str, object] | None:
        if metadata_json is None:
            return None
        try:
            value = json.loads(metadata_json)
        except json.JSONDecodeError:
            return None
        return value if isinstance(value, dict) else None
