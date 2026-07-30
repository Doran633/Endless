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
        session_id: str,
        title: str = "新对话",
        mode: str = "chat",
        bound_file_id: str | None = None,
    ) -> ChatSessionRecord:
        record = ChatSessionRecord(
            id=session_id,
            title=title,
            mode=mode,
            bound_file_id=bound_file_id,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def list_sessions(self) -> list[ChatSessionRecord]:
        statement = select(ChatSessionRecord).order_by(ChatSessionRecord.updated_at.desc())
        return list(self.db.scalars(statement).all())

    def get_session(self, session_id: str) -> ChatSessionRecord | None:
        return self.db.get(ChatSessionRecord, session_id)

    def delete_session(self, session_id: str) -> int:
        session = self.get_session(session_id)
        if session is None:
            return 0

        messages = self.list_messages(session_id)
        message_count = len(messages)
        for message in messages:
            self.db.delete(message)
        self.db.delete(session)
        self.db.commit()
        return message_count

    def update_bound_file(self, session_id: str, file_id: str) -> bool:
        session = self.get_session(session_id)
        if session is None:
            return False
        session.bound_file_id = file_id
        session.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return True

    def clear_bound_file(self, session_id: str) -> bool:
        session = self.get_session(session_id)
        if session is None:
            return False
        session.bound_file_id = None
        session.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return True

    def clear_bound_file_for_file(self, file_id: str) -> int:
        statement = select(ChatSessionRecord).where(ChatSessionRecord.bound_file_id == file_id)
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
        role: str,
        content: str,
        metadata_json: str | None = None,
    ) -> ChatMessageRecord:
        record = ChatMessageRecord(
            id=message_id,
            session_id=session_id,
            role=role,
            content=content,
            metadata_json=metadata_json,
        )
        self.db.add(record)
        self._touch_session(session_id)
        self.db.commit()
        self.db.refresh(record)
        return record

    def list_messages(self, session_id: str) -> list[ChatMessageRecord]:
        statement = (
            select(ChatMessageRecord)
            .where(ChatMessageRecord.session_id == session_id)
            .order_by(ChatMessageRecord.created_at.asc())
        )
        return list(self.db.scalars(statement).all())

    def _touch_session(self, session_id: str) -> None:
        session = self.get_session(session_id)
        if session is not None:
            session.updated_at = datetime.now(timezone.utc)
