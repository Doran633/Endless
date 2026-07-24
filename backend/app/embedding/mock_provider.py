from hashlib import sha256

from app.embedding.base import EmbeddingProvider


class MockEmbeddingProvider(EmbeddingProvider):
    def __init__(self, dimension: int) -> None:
        self.dimension = dimension

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_text(text) for text in texts]

    def _embed_text(self, text: str) -> list[float]:
        digest = sha256(text.encode("utf-8")).digest()
        values: list[float] = []

        while len(values) < self.dimension:
            for byte in digest:
                if len(values) >= self.dimension:
                    break
                # Scale bytes into a stable -1.0 to 1.0 range for local-only testing.
                values.append(round((byte / 127.5) - 1.0, 6))
            digest = sha256(digest).digest()

        return values

