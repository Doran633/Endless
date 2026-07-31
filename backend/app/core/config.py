import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
DATABASE_PATH = BACKEND_DIR / os.getenv("DATABASE_PATH", "data/beichen.db")

# Load local backend secrets before Settings is created.
# Existing OS environment variables still take precedence over values in .env.
load_dotenv(BACKEND_DIR / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Beichen Agent Backend")
    backend_dir: Path = BACKEND_DIR
    app_access_password: str | None = os.getenv("APP_ACCESS_PASSWORD") or None
    app_access_header: str = os.getenv("APP_ACCESS_HEADER", "X-Beichen-Access")
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
    allowed_upload_extensions: tuple[str, ...] = tuple(
        extension.strip().lower()
        for extension in os.getenv("ALLOWED_UPLOAD_EXTENSIONS", "txt,pdf,docx").split(",")
        if extension.strip()
    )


settings = Settings()
