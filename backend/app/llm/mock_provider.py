from app.core.config import settings
from app.llm.base import ChatMessage, LLMResponse


class MockLLMProvider:
    """Local fallback provider for MVP development without external API access."""

    def chat(self, messages: list[ChatMessage]) -> LLMResponse:
        latest_user_message = next(
            (message.content for message in reversed(messages) if message.role == "user"),
            "",
        )
        answer = (
            "这是一个本地 Mock LLM 回复。"
            f"我已收到你的问题：{latest_user_message}"
        )
        return LLMResponse(content=answer, model=settings.llm_model)
