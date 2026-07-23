from pathlib import Path

from app.core.config import settings
from app.core.errors import DocumentNotFoundError, DocumentParseError
from app.schemas.file import ParsedFileResponse


class DocumentParserService:
    supported_extensions = {"txt", "docx", "pdf"}
    preview_limit = 800

    def parse(self, file_id: str, extension: str) -> ParsedFileResponse:
        normalized_extension = extension.lower().lstrip(".")
        if normalized_extension not in self.supported_extensions:
            raise DocumentParseError(
                f"Unsupported parse file type. Allowed: {', '.join(sorted(self.supported_extensions))}"
            )

        file_path = settings.upload_dir / f"{file_id}.{normalized_extension}"
        if not file_path.exists() or not file_path.is_file():
            raise DocumentNotFoundError()

        text = self._parse_by_extension(file_path, normalized_extension)
        normalized_text = self._normalize_text(text)
        if not normalized_text:
            raise DocumentParseError(
                "No text content extracted. Scanned PDFs and image-only documents are not supported in v0.4"
            )

        return ParsedFileResponse(
            file_id=file_id,
            status="parsed",
            extension=normalized_extension,
            text_preview=self._build_preview(normalized_text),
            char_count=len(normalized_text),
        )

    def _parse_by_extension(self, file_path: Path, extension: str) -> str:
        if extension == "txt":
            return self._parse_txt(file_path)
        if extension == "docx":
            return self._parse_docx(file_path)
        if extension == "pdf":
            return self._parse_pdf(file_path)
        raise DocumentParseError("Unsupported parse file type")

    def _parse_txt(self, file_path: Path) -> str:
        for encoding in ("utf-8", "utf-8-sig", "gbk"):
            try:
                return file_path.read_text(encoding=encoding)
            except UnicodeDecodeError:
                continue
            except OSError as exc:
                raise DocumentParseError("Failed to read TXT file") from exc
        raise DocumentParseError("Failed to decode TXT file")

    def _parse_docx(self, file_path: Path) -> str:
        try:
            from docx import Document
            from docx.oxml.table import CT_Tbl
            from docx.oxml.text.paragraph import CT_P
            from docx.table import Table, _Cell
            from docx.text.paragraph import Paragraph

            document = Document(file_path)

            def iter_blocks(parent: object):
                container = parent._tc if isinstance(parent, _Cell) else parent.element.body
                for child in container.iterchildren():
                    if isinstance(child, CT_P):
                        yield Paragraph(child, parent)
                    elif isinstance(child, CT_Tbl):
                        yield Table(child, parent)

            def parse_container(parent: object) -> list[str]:
                parts: list[str] = []
                for block in iter_blocks(parent):
                    if isinstance(block, Paragraph):
                        paragraph_text = block.text.strip()
                        if paragraph_text:
                            parts.append(paragraph_text)
                    elif isinstance(block, Table):
                        parts.extend(format_table(block))
                return parts

            def parse_cell(cell: _Cell) -> str:
                # DOCX business tables often contain paragraphs or nested tables inside a cell.
                return "; ".join(parse_container(cell))

            def format_table(table: Table) -> list[str]:
                table_lines: list[str] = []
                for row_index, row in enumerate(table.rows, start=1):
                    cells: list[str] = []
                    seen_cells: set[int] = set()
                    for cell in row.cells:
                        cell_key = id(cell._tc)
                        if cell_key in seen_cells:
                            continue
                        seen_cells.add(cell_key)
                        cells.append(parse_cell(cell))
                    if any(cells):
                        table_lines.append(f"表格行{row_index}: {' | '.join(cells)}")
                return table_lines

            return "\n".join(parse_container(document))
        except Exception as exc:
            raise DocumentParseError("Failed to parse DOCX file") from exc

    def _parse_pdf(self, file_path: Path) -> str:
        try:
            from pypdf import PdfReader

            reader = PdfReader(str(file_path))
            pages_text = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages_text)
        except Exception as exc:
            raise DocumentParseError("Failed to parse PDF file") from exc

    def _normalize_text(self, text: str) -> str:
        lines = [line.strip() for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
        return "\n".join(line for line in lines if line)

    def _build_preview(self, text: str) -> str:
        if len(text) <= self.preview_limit:
            return text
        return f"{text[:self.preview_limit]}..."
