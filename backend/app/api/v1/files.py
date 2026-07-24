from fastapi import APIRouter, File, UploadFile

from app.core.responses import ok
from app.core.config import settings
from app.schemas.file import ChunkFileRequest, EmbedFileRequest, ParseFileRequest, StoreVectorRequest
from app.services.chunk_service import ChunkService
from app.services.document_parser_service import DocumentParserService
from app.services.embedding_service import EmbeddingService
from app.services.file_service import FileService
from app.services.vector_store_service import VectorStoreService


router = APIRouter()


@router.post("/files")
async def upload_file(file: UploadFile = File(...)) -> dict[str, object]:
    result = await FileService().upload(file)
    return ok(result.model_dump())


@router.post("/files/{file_id}/parse")
async def parse_file(file_id: str, request: ParseFileRequest) -> dict[str, object]:
    result = DocumentParserService().parse(file_id, request.extension)
    return ok(result.model_dump())


@router.post("/files/{file_id}/chunks")
async def chunk_file(file_id: str, request: ChunkFileRequest) -> dict[str, object]:
    document_text = DocumentParserService().parse_text(file_id, request.extension)
    result = ChunkService().chunk_text(file_id, document_text)
    return ok(result.model_dump())


@router.post("/files/{file_id}/embeddings")
async def embed_file(file_id: str, request: EmbedFileRequest) -> dict[str, object]:
    document_text = DocumentParserService().parse_text(file_id, request.extension)
    chunks = ChunkService().create_chunks(file_id, document_text)
    result = EmbeddingService().embed_chunks(file_id, chunks)
    return ok(result.model_dump())


@router.post("/files/{file_id}/vector-store")
async def store_file_vectors(file_id: str, request: StoreVectorRequest) -> dict[str, object]:
    document_text = DocumentParserService().parse_text(file_id, request.extension)
    chunks = ChunkService().create_chunks(file_id, document_text)
    embedding_service = EmbeddingService()
    vectors = embedding_service.embed_chunk_vectors(chunks)
    result = VectorStoreService().save_file_vectors(
        file_id=file_id,
        chunks=chunks,
        vectors=vectors,
        embedding_model=settings.embedding_model,
    )
    return ok(result.model_dump())


@router.get("/files/{file_id}/vector-store")
async def get_file_vector_store(file_id: str) -> dict[str, object]:
    result = VectorStoreService().get_file_vector_summary(file_id)
    return ok(result.model_dump())
