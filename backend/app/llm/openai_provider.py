import json
import urllib.error
import urllib.request

from app.core.config import settings
from app.core.errors import LLMConfigError, LLMProviderError
from app.llm.base import ChatMessage, LLMResponse


class OpenAIProvider:
    """Minimal OpenAI-compatible chat provider using the standard library."""

    def chat(self, messages: list[ChatMessage]) -> LLMResponse:
        if not settings.openai_api_key:
            raise LLMConfigError("OPENAI_API_KEY is not configured")

        payload = {
            "model": settings.llm_model,
            "messages": [
                {"role": message.role, "content": message.content}
                for message in messages
            ],
        }
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"{settings.openai_base_url.rstrip('/')}/chat/completions",
            data=data,
            method="POST",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(
                request, timeout=settings.llm_timeout_seconds
            ) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.URLError as exc:
            raise LLMProviderError(f"OpenAI request failed: {exc}") from exc
        except json.JSONDecodeError as exc:
            raise LLMProviderError("OpenAI response is not valid JSON") from exc

        try:
            choice = result["choices"][0]["message"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMProviderError("OpenAI response format is invalid") from exc

        usage = result.get("usage", {})
        return LLMResponse(
            content=choice.get("content", ""),
            model=result.get("model", settings.llm_model),
            input_tokens=usage.get("prompt_tokens"),
            output_tokens=usage.get("completion_tokens"),
        )
