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
