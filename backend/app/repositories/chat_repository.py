from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ChatMessageRecord, ChatSessionRecord


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(
        self,
        *,
        client_id: str,
        session_id: str,
        title: str = "新对话",
        mode: str = "chat",
        bound_file_id: str | None = None,
    ) -> ChatSessionRecord:
        record = ChatSessionRecord(
            id=session_id,
            client_id=client_id,
            title=title,
            mode=mode,
            bound_file_id=bound_file_id,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def list_sessions(self, client_id: str) -> list[ChatSessionRecord]:
        statement = (
            select(ChatSessionRecord)
            .where(ChatSessionRecord.client_id == client_id)
            .order_by(ChatSessionRecord.updated_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_session(self, session_id: str, client_id: str) -> ChatSessionRecord | None:
        statement = select(ChatSessionRecord).where(
            ChatSessionRecord.id == session_id,
            ChatSessionRecord.client_id == client_id,
        )
        return self.db.scalars(statement).first()

    def delete_session(self, session_id: str, client_id: str) -> int:
        session = self.get_session(session_id, client_id)
        if session is None:
            return 0

        messages = self.list_messages(session_id, client_id)
        message_count = len(messages)
        for message in messages:
            self.db.delete(message)
        self.db.delete(session)
        self.db.commit()
        return message_count

    def update_session_title(self, session_id: str, client_id: str, title: str) -> bool:
        session = self.get_session(session_id, client_id)
        if session is None:
            return False
        session.title = title
        session.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return True

    def update_bound_file(self, session_id: str, client_id: str, file_id: str) -> bool:
        session = self.get_session(session_id, client_id)
        if session is None:
            return False
        session.bound_file_id = file_id
        session.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return True

    def clear_bound_file(self, session_id: str, client_id: str) -> bool:
        session = self.get_session(session_id, client_id)
        if session is None:
            return False
        session.bound_file_id = None
        session.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return True

    def clear_bound_file_for_file(self, file_id: str, client_id: str) -> int:
        statement = select(ChatSessionRecord).where(
            ChatSessionRecord.bound_file_id == file_id,
            ChatSessionRecord.client_id == client_id,
        )
        sessions = list(self.db.scalars(statement).all())
        for session in sessions:
            session.bound_file_id = None
            session.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return len(sessions)

    def create_message(
        self,
        *,
        message_id: str,
        session_id: str,
        client_id: str,
        role: str,
        content: str,
        metadata_json: str | None = None,
    ) -> ChatMessageRecord:
        # Messages inherit ownership through their session.
        if self.get_session(session_id, client_id) is None:
            raise ValueError("Session does not belong to this client")

        record = ChatMessageRecord(
            id=message_id,
            session_id=session_id,
            role=role,
            content=content,
            metadata_json=metadata_json,
        )
        self.db.add(record)
        self._touch_session(session_id, client_id)
        self.db.commit()
        self.db.refresh(record)
        return record

    def list_messages(self, session_id: str, client_id: str) -> list[ChatMessageRecord]:
        statement = (
            select(ChatMessageRecord)
            .join(ChatSessionRecord, ChatMessageRecord.session_id == ChatSessionRecord.id)
            .where(ChatMessageRecord.session_id == session_id)
            .where(ChatSessionRecord.client_id == client_id)
            .order_by(ChatMessageRecord.created_at.asc())
        )
        return list(self.db.scalars(statement).all())

    def list_recent_messages(
        self, session_id: str, client_id: str, limit: int
    ) -> list[ChatMessageRecord]:
        statement = (
            select(ChatMessageRecord)
            .join(ChatSessionRecord, ChatMessageRecord.session_id == ChatSessionRecord.id)
            .where(ChatMessageRecord.session_id == session_id)
            .where(ChatSessionRecord.client_id == client_id)
            .order_by(ChatMessageRecord.created_at.desc())
            .limit(limit)
        )
        records = list(self.db.scalars(statement).all())
        return list(reversed(records))

    def _touch_session(self, session_id: str, client_id: str) -> None:
        session = self.get_session(session_id, client_id)
        if session is not None:
            session.updated_at = datetime.now(timezone.utc)
