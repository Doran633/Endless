import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "WorkBuddy Backend"
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock").lower()
    llm_model: str = os.getenv("LLM_MODEL", "mock-chat")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")


settings = Settings()
