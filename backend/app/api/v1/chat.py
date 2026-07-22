from fastapi import APIRouter

from app.core.responses import ok
from app.schemas.chat import ChatRequest
from app.services.chat_service import ChatService


router = APIRouter()


@router.post("/chat")
def chat(request: ChatRequest) -> dict[str, object]:
    result = ChatService().answer(request.message)
    return ok(result)
