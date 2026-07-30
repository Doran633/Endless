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
    def answer_and_persist_chat(self, session_id: str, message: str) -> dict[str, object]:
        self._ensure_session_exists(session_id)

        result = ChatService().answer(message)
        self._save_message(session_id=session_id, role="user", content=message)
        self._save_message(
            session_id=session_id,
            role="assistant",
            content=str(result["answer"]),
            metadata={
                "token_count": self._sum_token_count(result.get("usage")),
            },
        )
        return result

    def ask_file_and_persist(
        self,
        *,
        session_id: str,
        file_id: str,
        query: str,
        top_k: int,
    ) -> AskFileResponse:
        self._ensure_session_exists(session_id)
        rag_file_name = self._get_file_name(file_id)

        result = RagService().ask_file(file_id, query, top_k)
        self._save_message(session_id=session_id, role="user", content=result.query)
        self._save_message(
            session_id=session_id,
            role="assistant",
            content=result.answer,
            metadata=self._build_rag_metadata(result, rag_file_name),
        )
        return result

    def create_session(self, title: str = "新对话", mode: str = "chat") -> ChatSessionResponse:
        try:
            with SessionLocal() as db:
                record = ChatRepository(db).create_session(
                    session_id=str(uuid4()),
                    title=title,
                    mode=mode,
                )
                return self._to_session_response(record)
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to create chat session") from exc

    def list_sessions(self) -> ChatSessionListResponse:
        try:
            with SessionLocal() as db:
                records = ChatRepository(db).list_sessions()
                return ChatSessionListResponse(
                    sessions=[self._to_session_response(record) for record in records]
                )
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to list chat sessions") from exc

    def get_messages(self, session_id: str) -> ChatMessageListResponse:
        try:
            with SessionLocal() as db:
                repository = ChatRepository(db)
                if repository.get_session(session_id) is None:
                    raise ChatSessionNotFoundError()
                records = repository.list_messages(session_id)
                return ChatMessageListResponse(
                    session_id=session_id,
                    messages=[self._to_message_response(record) for record in records],
                )
        except ChatSessionNotFoundError:
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to list chat messages") from exc

    def delete_session(self, session_id: str) -> DeleteChatSessionResponse:
        try:
            with SessionLocal() as db:
                repository = ChatRepository(db)
                if repository.get_session(session_id) is None:
                    raise ChatSessionNotFoundError()
                message_count = repository.delete_session(session_id)
                return DeleteChatSessionResponse(
                    session_id=session_id,
                    deleted=True,
                    message_count_deleted=message_count,
                )
        except ChatSessionNotFoundError:
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to delete chat session") from exc

    def bind_file(self, session_id: str, file_id: str | None) -> ChatSessionResponse:
        try:
            with SessionLocal() as db:
                chat_repository = ChatRepository(db)
                if chat_repository.get_session(session_id) is None:
                    raise ChatSessionNotFoundError()

                if file_id is None:
                    if not chat_repository.clear_bound_file(session_id):
                        raise ChatSessionNotFoundError()
                else:
                    file_record = FileRepository(db).get_file(file_id)
                    if file_record is None:
                        raise ChatFileBindingError("Cannot bind a missing file")
                    if file_record.status != "indexed":
                        raise ChatFileBindingError("Only indexed files can be bound to a session")
                    if not chat_repository.update_bound_file(session_id, file_id):
                        raise ChatSessionNotFoundError()

                record = chat_repository.get_session(session_id)
                if record is None:
                    raise ChatSessionNotFoundError()
                return self._to_session_response(record)
        except (ChatFileBindingError, ChatSessionNotFoundError):
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to bind file to chat session") from exc

    def clear_file_binding_for_deleted_file(self, file_id: str) -> int:
        try:
            with SessionLocal() as db:
                return ChatRepository(db).clear_bound_file_for_file(file_id)
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to clear deleted file bindings") from exc

    def _ensure_session_exists(self, session_id: str) -> None:
        try:
            with SessionLocal() as db:
                if ChatRepository(db).get_session(session_id) is None:
                    raise ChatSessionNotFoundError()
        except ChatSessionNotFoundError:
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to load chat session") from exc

    def _save_message(
        self,
        *,
        session_id: str,
        role: str,
        content: str,
        metadata: dict[str, object] | None = None,
    ) -> None:
        try:
            with SessionLocal() as db:
                repository = ChatRepository(db)
                if repository.get_session(session_id) is None:
                    raise ChatSessionNotFoundError()
                repository.create_message(
                    message_id=str(uuid4()),
                    session_id=session_id,
                    role=role,
                    content=content,
                    metadata_json=self._dump_metadata(metadata),
                )
        except ChatSessionNotFoundError:
            raise
        except SQLAlchemyError as exc:
            raise ChatSessionStorageError("Failed to save chat message") from exc

    def _get_file_name(self, file_id: str) -> str | None:
        try:
            with SessionLocal() as db:
                record = FileRepository(db).get_file(file_id)
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
            "token_count": self._sum_token_count(result.usage),
        }

    def _chunk_to_metadata(self, chunk: RetrievalResult) -> dict[str, object]:
        return {
            "chunk_id": chunk.chunk_id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "char_count": chunk.char_count,
            "score": chunk.score,
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
