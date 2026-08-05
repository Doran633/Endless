import os
import re
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
DATABASE_PATH = BACKEND_DIR / os.getenv("DATABASE_PATH", "data/beichen.db")

# Load local backend secrets before Settings is created.
# Existing OS environment variables still take precedence over values in .env.
load_dotenv(BACKEND_DIR / ".env", override=False)


def _load_invite_codes() -> tuple[str, ...]:
    """Load comma-separated 6-digit invite codes from local environment."""

    raw_codes = os.getenv("APP_INVITE_CODES", "")
    return tuple(
        code
        for code in (item.strip() for item in raw_codes.split(","))
        if re.fullmatch(r"\d{6}", code)
    )


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Beichen Agent Backend")
    backend_dir: Path = BACKEND_DIR
    app_access_password: str | None = os.getenv("APP_ACCESS_PASSWORD") or None
    app_access_header: str = os.getenv("APP_ACCESS_HEADER", "X-Beichen-Access")
    app_invite_codes: tuple[str, ...] = _load_invite_codes()
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock").lower()
    llm_model: str = os.getenv("LLM_MODEL", "mock-chat")
    llm_timeout_seconds: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER", "mock").lower()
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "mock-embedding")
    embedding_dimension: int = int(os.getenv("EMBEDDING_DIMENSION", "16"))
    embedding_timeout_seconds: int = int(os.getenv("EMBEDDING_TIMEOUT_SECONDS", "60"))
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    embedding_api_key: str | None = os.getenv("EMBEDDING_API_KEY") or openai_api_key
    embedding_base_url: str = os.getenv("EMBEDDING_BASE_URL") or openai_base_url
    database_path: Path = DATABASE_PATH
    database_url: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}"
    )
    upload_dir: Path = BACKEND_DIR / os.getenv("UPLOAD_DIR", "uploads")
    vector_store_dir: Path = BACKEND_DIR / os.getenv("VECTOR_STORE_DIR", "vector_store")
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "800"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "120"))
    rag_default_top_k: int = int(os.getenv("RAG_DEFAULT_TOP_K", "3"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO").upper()
    log_to_file: bool = os.getenv("LOG_TO_FILE", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    log_dir: Path = BACKEND_DIR / os.getenv("LOG_DIR", "logs")
    allowed_upload_extensions: tuple[str, ...] = tuple(
        extension.strip().lower()
        for extension in os.getenv("ALLOWED_UPLOAD_EXTENSIONS", "txt,pdf,docx").split(",")
        if extension.strip()
    )


settings = Settings()
