from pydantic import BaseModel


class UploadedFileResponse(BaseModel):
    id: str
    original_name: str
    status: str
    size_bytes: int
    extension: str
    created_at: str
