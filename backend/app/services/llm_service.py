from app.core.config import settings
from app.core.errors import LLMConfigError
from app.llm.base import ChatMessage, LLMProvider, LLMResponse
from app.llm.mock_provider import MockLLMProvider
from app.llm.openai_provider import OpenAIProvider


class LLMService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self.provider = provider or self._build_provider()

    def chat(self, messages: list[ChatMessage]) -> LLMResponse:
        return self.provider.chat(messages)

    def _build_provider(self) -> LLMProvider:
        providers: dict[str, type[LLMProvider]] = {
            "mock": MockLLMProvider,
            "openai": OpenAIProvider,
        }
        provider_class = providers.get(settings.llm_provider)
        if provider_class is None:
            supported = ", ".join(sorted(providers))
            raise LLMConfigError(
                f"Unknown LLM_PROVIDER '{settings.llm_provider}'. Supported providers: {supported}"
            )
        return provider_class()
