from app.core.errors import ChunkError
from app.schemas.file import ChunkFileResponse, DocumentChunk


class ChunkService:
    chunk_size = 800
    chunk_overlap = 120
    preview_limit = 3

    def chunk_text(self, file_id: str, text: str) -> ChunkFileResponse:
        normalized_text = self._normalize_text(text)
        if not normalized_text:
            raise ChunkError("Cannot chunk empty document text")

        chunks = self._split_text(file_id, normalized_text)
        if not chunks:
            raise ChunkError("No chunks generated from document text")

        return ChunkFileResponse(
            file_id=file_id,
            status="chunked",
            chunk_count=len(chunks),
            chunk_preview=chunks[: self.preview_limit],
        )

    def _normalize_text(self, text: str) -> str:
        paragraphs = [paragraph.strip() for paragraph in text.split("\n") if paragraph.strip()]
        return "\n".join(paragraphs)

    def _split_text(self, file_id: str, text: str) -> list[DocumentChunk]:
        chunks: list[DocumentChunk] = []
        start = 0
        index = 0

        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            content = text[start:end].strip()
            if content:
                chunks.append(
                    DocumentChunk(
                        chunk_id=f"{file_id}-{index}",
                        file_id=file_id,
                        chunk_index=index,
                        content=content,
                        char_count=len(content),
                    )
                )
                index += 1

            if end >= len(text):
                break

            start = max(end - self.chunk_overlap, start + 1)

        return chunks
