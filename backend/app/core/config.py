import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]

# Load local backend secrets before Settings is created.
# Existing OS environment variables still take precedence over values in .env.
load_dotenv(BACKEND_DIR / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    app_name: str = "WorkBuddy Backend"
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock").lower()
    llm_model: str = os.getenv("LLM_MODEL", "mock-chat")
    llm_timeout_seconds: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    upload_dir: Path = BACKEND_DIR / os.getenv("UPLOAD_DIR", "uploads")
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))
    allowed_upload_extensions: tuple[str, ...] = tuple(
        extension.strip().lower()
        for extension in os.getenv("ALLOWED_UPLOAD_EXTENSIONS", "txt,pdf,docx").split(",")
        if extension.strip()
    )


settings = Settings()
