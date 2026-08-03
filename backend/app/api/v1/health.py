from fastapi import APIRouter

from app.core.config import settings
from app.schemas.health import AccessControlConfig, HealthConfigResponse


router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/config")
def health_config() -> HealthConfigResponse:
    """Return non-sensitive runtime config for local debugging."""

    return HealthConfigResponse(
        app_name=settings.app_name,
        llm_provider=settings.llm_provider,
        llm_model=settings.llm_model,
        embedding_provider=settings.embedding_provider,
        embedding_model=settings.embedding_model,
        embedding_dimension=settings.embedding_dimension,
        database_path=_relative_backend_path(settings.database_path),
        upload_dir=_relative_backend_path(settings.upload_dir),
        vector_store_dir=_relative_backend_path(settings.vector_store_dir),
        access_control=AccessControlConfig(
            enabled=_access_control_enabled(),
            mode=_access_control_mode(),
            header=settings.app_access_header,
            invite_code_count=len(settings.app_invite_codes),
        ),
    )


def _access_control_enabled() -> bool:
    return bool(settings.app_invite_codes or settings.app_access_password)


def _access_control_mode() -> str:
    if settings.app_invite_codes:
        return "invite_codes"
    if settings.app_access_password:
        return "legacy_password"
    return "disabled"


def _relative_backend_path(path) -> str:
    try:
        return str(path.relative_to(settings.backend_dir))
    except ValueError:
        return str(path)
