import json
import urllib.error
import urllib.request

from app.core.config import settings
from app.core.errors import EmbeddingConfigError, EmbeddingProviderError
from app.embedding.base import EmbeddingProvider


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI-compatible embedding provider using only the Python standard library."""

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if not settings.embedding_api_key:
            raise EmbeddingConfigError("EMBEDDING_API_KEY or OPENAI_API_KEY is not configured")

        payload = {
            "model": settings.embedding_model,
            "input": texts,
        }
        request = urllib.request.Request(
            f"{settings.embedding_base_url.rstrip('/')}/embeddings",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={
                "Authorization": f"Bearer {settings.embedding_api_key}",
                "Content-Type": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(
                request, timeout=settings.embedding_timeout_seconds
            ) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise EmbeddingProviderError(
                f"Embedding provider returned HTTP {exc.code}: {detail[:300]}"
            ) from exc
        except urllib.error.URLError as exc:
            raise EmbeddingProviderError(f"Embedding provider request failed: {exc}") from exc
        except json.JSONDecodeError as exc:
            raise EmbeddingProviderError("Embedding provider response is not valid JSON") from exc

        try:
            items = result["data"]
            ordered_items = sorted(
                enumerate(items),
                key=lambda pair: pair[1].get("index", pair[0]),
            )
            return [item["embedding"] for _, item in ordered_items]
        except (KeyError, TypeError) as exc:
            raise EmbeddingProviderError("Embedding provider response format is invalid") from exc
