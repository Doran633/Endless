from fastapi import APIRouter

from app.core.responses import ok
from app.schemas.chat import BindSessionFileRequest, ChatRequest, ChatSessionCreateRequest
from app.services.chat_service import ChatService
from app.services.conversation_service import ConversationService


router = APIRouter()
session_router = APIRouter()


@router.post("/chat")
def chat(request: ChatRequest) -> dict[str, object]:
    if request.session_id:
        result = ConversationService().answer_and_persist_chat(
            request.session_id, request.message
        )
    else:
        result = ChatService().answer(request.message)
    return ok(result)


@session_router.get("/chat/sessions")
def list_chat_sessions() -> dict[str, object]:
    result = ConversationService().list_sessions()
    return ok(result.model_dump())


@session_router.post("/chat/sessions")
def create_chat_session(request: ChatSessionCreateRequest) -> dict[str, object]:
    result = ConversationService().create_session(title=request.title, mode=request.mode)
    return ok(result.model_dump())


@session_router.delete("/chat/sessions/{session_id}")
def delete_chat_session(session_id: str) -> dict[str, object]:
    result = ConversationService().delete_session(session_id)
    return ok(result.model_dump())


@session_router.get("/chat/sessions/{session_id}/messages")
def list_chat_messages(session_id: str) -> dict[str, object]:
    result = ConversationService().get_messages(session_id)
    return ok(result.model_dump())


@session_router.patch("/chat/sessions/{session_id}/file")
def bind_chat_session_file(
    session_id: str, request: BindSessionFileRequest
) -> dict[str, object]:
    result = ConversationService().bind_file(session_id, request.file_id)
    return ok(result.model_dump())
