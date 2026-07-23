from pydantic import BaseModel


class UploadedFileResponse(BaseModel):
    id: str
    original_name: str
    status: str
    size_bytes: int
    extension: str
    created_at: str


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


class ChunkFileResponse(BaseModel):
    file_id: str
    status: str
    chunk_count: int
    chunk_preview: list[DocumentChunk]
