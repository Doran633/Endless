from pydantic import BaseModel


class AccessControlConfig(BaseModel):
    enabled: bool
    mode: str
    header: str
    invite_code_count: int


class HealthConfigResponse(BaseModel):
    app_name: str
    llm_provider: str
    llm_model: str
    embedding_provider: str
    embedding_model: str
    embedding_dimension: int
    database_path: str
    upload_dir: str
    vector_store_dir: str
    access_control: AccessControlConfig
