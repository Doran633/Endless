import re
from dataclasses import dataclass

from app.core.config import settings
from app.core.errors import ChunkError
from app.db.database import SessionLocal
from app.repositories.file_repository import FileRepository
from app.schemas.file import ChunkFileResponse, DocumentChunk


@dataclass
class TextSection:
    title: str | None
    path: str | None
    content: str


class ChunkService:
    preview_limit = 3
    heading_patterns = (
        re.compile(r"^(#{1,6})\s+(.+)$"),
        re.compile(r"^([一二三四五六七八九十百]+)、\s*(.+)$"),
        re.compile(r"^(\d+)[.、]\s*(.+)$"),
    )

    def __init__(self, chunk_size: int | None = None, chunk_overlap: int | None = None) -> None:
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap if chunk_overlap is not None else settings.chunk_overlap

    def chunk_text(self, file_id: str, text: str, client_id: str) -> ChunkFileResponse:
        try:
            chunks = self.create_chunks(file_id, text)
            with SessionLocal() as db:
                FileRepository(db).update_chunked(file_id, client_id, chunk_count=len(chunks))
            return ChunkFileResponse(
                file_id=file_id,
                status="chunked",
                chunk_count=len(chunks),
                chunk_preview=chunks[: self.preview_limit],
            )
        except Exception as exc:
            self._mark_failed(file_id, client_id, str(exc))
            raise

    def create_chunks(self, file_id: str, text: str) -> list[DocumentChunk]:
        normalized_text = self._normalize_text(text)
        if not normalized_text:
            raise ChunkError("Cannot chunk empty document text")

        chunks = self._split_text(file_id, normalized_text)
        if not chunks:
            raise ChunkError("No chunks generated from document text")

        return chunks

    def create_file_chunks(
        self, file_id: str, text: str, client_id: str | None = None
    ) -> list[DocumentChunk]:
        try:
            return self.create_chunks(file_id, text)
        except Exception as exc:
            if client_id is not None:
                self._mark_failed(file_id, client_id, str(exc))
            raise

    def _mark_failed(self, file_id: str, client_id: str, error_message: str) -> None:
        try:
            with SessionLocal() as db:
                FileRepository(db).touch_failed(file_id, client_id, error_message)
        except Exception:
            pass

    def _normalize_text(self, text: str) -> str:
        paragraphs = [paragraph.strip() for paragraph in text.split("\n") if paragraph.strip()]
        return "\n".join(paragraphs)

    def _split_text(self, file_id: str, text: str) -> list[DocumentChunk]:
        sections = self._split_sections(text)
        if len(sections) > 1 or sections[0].title:
            return self._split_sections_into_chunks(file_id, sections)

        return self._split_content(
            file_id=file_id,
            content=text,
            start_index=0,
            section_title=None,
            section_path=None,
        )

    def _split_sections(self, text: str) -> list[TextSection]:
        sections: list[TextSection] = []
        current_lines: list[str] = []
        current_title: str | None = None
        current_path: str | None = None
        path_by_level: dict[int, str] = {}

        for line in text.split("\n"):
            heading = self._parse_heading(line)
            if heading is None:
                current_lines.append(line)
                continue

            if current_lines:
                sections.append(
                    TextSection(
                        title=current_title,
                        path=current_path,
                        content="\n".join(current_lines).strip(),
                    )
                )

            level, title = heading
            path_by_level = {
                existing_level: existing_title
                for existing_level, existing_title in path_by_level.items()
                if existing_level < level
            }
            path_by_level[level] = title
            current_title = title
            current_path = " > ".join(
                path_by_level[item_level] for item_level in sorted(path_by_level)
            )
            # Keep the heading inside the chunk so the embedding vector has section context.
            current_lines = [line]

        if current_lines:
            sections.append(
                TextSection(
                    title=current_title,
                    path=current_path,
                    content="\n".join(current_lines).strip(),
                )
            )

        return [section for section in sections if section.content]

    def _parse_heading(self, line: str) -> tuple[int, str] | None:
        stripped = line.strip()
        if not stripped:
            return None

        markdown_match = self.heading_patterns[0].match(stripped)
        if markdown_match:
            return len(markdown_match.group(1)), markdown_match.group(2).strip()

        chinese_match = self.heading_patterns[1].match(stripped)
        if chinese_match:
            return 1, chinese_match.group(2).strip()

        numbered_match = self.heading_patterns[2].match(stripped)
        if numbered_match and len(stripped) <= 80:
            return 2, numbered_match.group(2).strip()

        return None

    def _split_sections_into_chunks(
        self, file_id: str, sections: list[TextSection]
    ) -> list[DocumentChunk]:
        chunks: list[DocumentChunk] = []
        for section in sections:
            section_chunks = self._split_content(
                file_id=file_id,
                content=section.content,
                start_index=len(chunks),
                section_title=section.title,
                section_path=section.path,
            )
            chunks.extend(section_chunks)
        return chunks

    def _split_content(
        self,
        *,
        file_id: str,
        content: str,
        start_index: int,
        section_title: str | None,
        section_path: str | None,
    ) -> list[DocumentChunk]:
        chunks: list[DocumentChunk] = []
        start = 0
        index = start_index

        while start < len(content):
            end = min(start + self.chunk_size, len(content))
            chunk_content = content[start:end].strip()
            if chunk_content:
                chunks.append(
                    DocumentChunk(
                        chunk_id=f"{file_id}-{index}",
                        file_id=file_id,
                        chunk_index=index,
                        content=chunk_content,
                        char_count=len(chunk_content),
                        section_title=section_title,
                        section_path=section_path,
                    )
                )
                index += 1

            if end >= len(content):
                break

            start = max(end - self.chunk_overlap, start + 1)

        return chunks
