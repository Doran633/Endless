from app.core.config import settings
from app.llm.base import ChatMessage, LLMProvider, LLMResponse
from app.llm.mock_provider import MockLLMProvider
from app.llm.openai_provider import OpenAIProvider


class LLMService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self.provider = provider or self._build_provider()

    def chat(self, messages: list[ChatMessage]) -> LLMResponse:
        return self.provider.chat(messages)

    def _build_provider(self) -> LLMProvider:
        if settings.llm_provider == "openai":
            return OpenAIProvider()
        return MockLLMProvider()
