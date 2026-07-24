class AppError(Exception):
    """Base application error that can be returned as a stable API response."""

    def __init__(self, message: str, code: int = 40000, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class LLMConfigError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, code=43001, status_code=400)


class LLMProviderError(AppError):
    def __init__(self, message: str = "LLM provider request failed") -> None:
        super().__init__(message=message, code=43002, status_code=502)


class FileValidationError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, code=42001, status_code=400)


class FileStorageError(AppError):
    def __init__(self, message: str = "File storage failed") -> None:
        super().__init__(message=message, code=42002, status_code=500)


class DocumentNotFoundError(AppError):
    def __init__(self, message: str = "Uploaded file not found") -> None:
        super().__init__(message=message, code=44001, status_code=404)


class DocumentParseError(AppError):
    def __init__(self, message: str = "Failed to parse document") -> None:
        super().__init__(message=message, code=44002, status_code=400)


class ChunkError(AppError):
    def __init__(self, message: str = "Failed to chunk document") -> None:
        super().__init__(message=message, code=45001, status_code=400)


class EmbeddingConfigError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, code=46001, status_code=400)


class EmbeddingProviderError(AppError):
    def __init__(self, message: str = "Embedding provider request failed") -> None:
        super().__init__(message=message, code=46002, status_code=502)


class VectorStoreError(AppError):
    def __init__(self, message: str = "Vector store operation failed") -> None:
        super().__init__(message=message, code=47001, status_code=500)


class VectorStoreNotFoundError(AppError):
    def __init__(self, message: str = "Vector store index not found") -> None:
        super().__init__(message=message, code=47002, status_code=404)


class RetrievalError(AppError):
    def __init__(self, message: str = "Retrieval failed") -> None:
        super().__init__(message=message, code=48001, status_code=400)


class RagError(AppError):
    def __init__(self, message: str = "RAG question answering failed") -> None:
        super().__init__(message=message, code=49001, status_code=400)
