from fastapi import APIRouter, File, UploadFile

from app.core.responses import ok
from app.services.file_service import FileService


router = APIRouter()


@router.post("/files")
async def upload_file(file: UploadFile = File(...)) -> dict[str, object]:
    result = await FileService().upload(file)
    return ok(result.model_dump())
