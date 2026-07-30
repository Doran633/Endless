from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    session_id: str | None = None


class TokenUsage(BaseModel):
    input_tokens: int | None = None
    output_tokens: int | None = None


class ChatResponse(BaseModel):
    answer: str
    model: str
    usage: TokenUsage


class ChatSessionCreateRequest(BaseModel):
    title: str = Field(default="新对话", min_length=1, max_length=255)
    mode: str = Field(default="chat", min_length=1, max_length=32)


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    mode: str
    bound_file_id: str | None = None
    created_at: str
    updated_at: str


class ChatSessionListResponse(BaseModel):
    sessions: list[ChatSessionResponse]


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    metadata: dict[str, Any] | None = None
    created_at: str


class ChatMessageListResponse(BaseModel):
    session_id: str
    messages: list[ChatMessageResponse]


class BindSessionFileRequest(BaseModel):
    file_id: str | None = None


class DeleteChatSessionResponse(BaseModel):
    session_id: str
    deleted: bool
    message_count_deleted: int
