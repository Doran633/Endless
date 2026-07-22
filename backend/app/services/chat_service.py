from app.llm.base import ChatMessage
from app.services.llm_service import LLMService


class ChatService:
    def __init__(self, llm_service: LLMService | None = None) -> None:
        self.llm_service = llm_service or LLMService()

    def answer(self, content: str) -> dict[str, object]:
        messages = [
            ChatMessage(
                role="system",
                content="你是 WorkBuddy 企业内部 AI 助手，回答要清晰、简洁、可执行。",
            ),
            ChatMessage(role="user", content=content),
        ]
        response = self.llm_service.chat(messages)
        return {
            "answer": response.content,
            "model": response.model,
            "usage": {
                "input_tokens": response.input_tokens,
                "output_tokens": response.output_tokens,
            },
        }
