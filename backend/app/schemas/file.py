from pydantic import BaseModel, Field

from app.core.config import settings


class UploadedFileResponse(BaseModel):
    id: str
    original_name: str
    status: str
    size_bytes: int
    extension: str
    created_at: str


class FileRecordResponse(BaseModel):
    id: str
    original_name: str
    status: str
    size_bytes: int
    extension: str
    created_at: str
    updated_at: str
    text_preview: str | None = None
    char_count: int | None = None
    chunk_count: int | None = None
    embedding_count: int | None = None
    embedding_dimension: int | None = None
    embedding_model: str | None = None
    vector_store_path: str | None = None
    error_message: str | None = None


class FileListResponse(BaseModel):
    files: list[FileRecordResponse]


class DeleteFileResponse(BaseModel):
    file_id: str
    deleted: bool
    original_deleted: bool
    vector_index_deleted: bool


class ParseFileRequest(BaseModel):
    extension: str


class ParsedFileResponse(BaseModel):
    file_id: str
    status: str
    extension: str
    text_preview: str
    char_count: int


class ChunkFileRequest(BaseModel):
    extension: str


class DocumentChunk(BaseModel):
    chunk_id: str
    file_id: str
    chunk_index: int
    content: str
    char_count: int
    section_title: str | None = None
    section_path: str | None = None


class ChunkFileResponse(BaseModel):
    file_id: str
    status: str
    chunk_count: int
    chunk_preview: list[DocumentChunk]


class EmbedFileRequest(BaseModel):
    extension: str


class EmbeddingPreview(BaseModel):
    chunk_id: str
    chunk_index: int
    vector_preview: list[float]


class EmbedFileResponse(BaseModel):
    file_id: str
    status: str
    chunk_count: int
    embedding_count: int
    embedding_dimension: int
    embedding_preview: list[EmbeddingPreview]


class StoreVectorRequest(BaseModel):
    extension: str


class VectorStoreItem(BaseModel):
    chunk_id: str
    file_id: str
    chunk_index: int
    content: str
    char_count: int
    section_title: str | None = None
    section_path: str | None = None
    embedding: list[float]


class VectorStoreIndex(BaseModel):
    file_id: str
    status: str
    embedding_model: str
    embedding_dimension: int
    chunk_count: int
    embedding_count: int
    created_at: str
    items: list[VectorStoreItem]


class VectorStoreSummaryResponse(BaseModel):
    file_id: str
    status: str
    chunk_count: int
    embedding_count: int
    embedding_dimension: int
    embedding_model: str
    storage_path: str
    created_at: str


class RetrieveFileRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int = Field(default=settings.rag_default_top_k, ge=1, le=10)


class RetrievalResult(BaseModel):
    chunk_id: str
    chunk_index: int
    content: str
    char_count: int
    score: float
    section_title: str | None = None
    section_path: str | None = None
    raw_score: float | None = None
    keyword_bonus: float = 0
    final_score: float | None = None
    relevance_level: str = "medium"


class RetrieveFileResponse(BaseModel):
    file_id: str
    query: str
    top_k: int
    result_count: int
    results: list[RetrievalResult]
    max_score: float | None = None
    min_score: float | None = None
    average_score: float | None = None


class AskFileRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int = Field(default=settings.rag_default_top_k, ge=1, le=8)
    session_id: str | None = None


class RagDebugTrace(BaseModel):
    trace_id: str
    file_id: str
    query: str
    top_k: int
    retrieved_count: int
    max_score: float | None = None
    min_score: float | None = None
    average_score: float | None = None
    used_chunk_ids: list[str]
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None
    confidence: str
    no_answer: bool


class AskFileResponse(BaseModel):
    file_id: str
    query: str
    answer: str
    top_k: int
    used_chunk_count: int
    used_chunks: list[RetrievalResult]
    provider: str
    model: str
    usage: dict[str, int | None]
    debug_trace: RagDebugTrace | None = None
