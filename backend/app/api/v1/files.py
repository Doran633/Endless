from fastapi import APIRouter, Depends, File, UploadFile

from app.core.client_context import get_client_id
from app.core.config import settings
from app.core.responses import ok
from app.schemas.file import (
    AskFileRequest,
    ChunkFileRequest,
    EmbedFileRequest,
    ParseFileRequest,
    RetrieveFileRequest,
    StoreVectorRequest,
)
from app.services.chunk_service import ChunkService
from app.services.conversation_service import ConversationService
from app.services.document_parser_service import DocumentParserService
from app.services.embedding_service import EmbeddingService
from app.services.file_service import FileService
from app.services.rag_service import RagService
from app.services.retrieval_service import RetrievalService
from app.services.vector_store_service import VectorStoreService


router = APIRouter()


@router.post("/files")
async def upload_file(
    client_id: str = Depends(get_client_id), file: UploadFile = File(...)
) -> dict[str, object]:
    result = await FileService().upload(file, client_id)
    return ok(result.model_dump())


@router.get("/files")
async def list_files(client_id: str = Depends(get_client_id)) -> dict[str, object]:
    result = FileService().list_files(client_id)
    return ok(result.model_dump())


@router.delete("/files/{file_id}")
async def delete_file(file_id: str, client_id: str = Depends(get_client_id)) -> dict[str, object]:
    result = FileService().delete_file(file_id, client_id)
    return ok(result.model_dump())


@router.post("/files/{file_id}/parse")
async def parse_file(
    file_id: str, request: ParseFileRequest, client_id: str = Depends(get_client_id)
) -> dict[str, object]:
    result = DocumentParserService().parse(file_id, request.extension, client_id)
    return ok(result.model_dump())


@router.post("/files/{file_id}/chunks")
async def chunk_file(
    file_id: str, request: ChunkFileRequest, client_id: str = Depends(get_client_id)
) -> dict[str, object]:
    document_text = DocumentParserService().parse_text(file_id, request.extension, client_id)
    result = ChunkService().chunk_text(file_id, document_text, client_id)
    return ok(result.model_dump())


@router.post("/files/{file_id}/embeddings")
async def embed_file(
    file_id: str, request: EmbedFileRequest, client_id: str = Depends(get_client_id)
) -> dict[str, object]:
    document_text = DocumentParserService().parse_text(file_id, request.extension, client_id)
    chunks = ChunkService().create_file_chunks(file_id, document_text, client_id)
    result = EmbeddingService().embed_chunks(file_id, chunks, client_id)
    return ok(result.model_dump())


@router.post("/files/{file_id}/vector-store")
async def store_file_vectors(
    file_id: str, request: StoreVectorRequest, client_id: str = Depends(get_client_id)
) -> dict[str, object]:
    document_text = DocumentParserService().parse_text(file_id, request.extension, client_id)
    chunks = ChunkService().create_file_chunks(file_id, document_text, client_id)
    embedding_service = EmbeddingService()
    vectors = embedding_service.embed_file_vectors(file_id, chunks, client_id)
    result = VectorStoreService().save_file_vectors(
        file_id=file_id,
        client_id=client_id,
        chunks=chunks,
        vectors=vectors,
        embedding_model=settings.embedding_model,
    )
    return ok(result.model_dump())


@router.get("/files/{file_id}/vector-store")
async def get_file_vector_store(
    file_id: str, client_id: str = Depends(get_client_id)
) -> dict[str, object]:
    result = VectorStoreService().get_file_vector_summary(file_id, client_id)
    return ok(result.model_dump())


@router.post("/files/{file_id}/retrieve")
async def retrieve_file_chunks(
    file_id: str, request: RetrieveFileRequest, client_id: str = Depends(get_client_id)
) -> dict[str, object]:
    result = RetrievalService().retrieve(file_id, request.query, request.top_k, client_id)
    return ok(result.model_dump())


@router.post("/files/{file_id}/ask")
async def ask_file(
    file_id: str, request: AskFileRequest, client_id: str = Depends(get_client_id)
) -> dict[str, object]:
    if request.session_id:
        result = ConversationService().ask_file_and_persist(
            session_id=request.session_id,
            client_id=client_id,
            file_id=file_id,
            query=request.query,
            top_k=request.top_k,
        )
    else:
        result = RagService().ask_file(file_id, request.query, request.top_k, client_id=client_id)
    return ok(result.model_dump())
