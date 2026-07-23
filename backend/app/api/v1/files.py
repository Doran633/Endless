from fastapi import APIRouter, File, UploadFile

from app.core.responses import ok
from app.schemas.file import ParseFileRequest
from app.services.document_parser_service import DocumentParserService
from app.services.file_service import FileService


router = APIRouter()


@router.post("/files")
async def upload_file(file: UploadFile = File(...)) -> dict[str, object]:
    result = await FileService().upload(file)
    return ok(result.model_dump())


@router.post("/files/{file_id}/parse")
async def parse_file(file_id: str, request: ParseFileRequest) -> dict[str, object]:
    result = DocumentParserService().parse(file_id, request.extension)
    return ok(result.model_dump())
