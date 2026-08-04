import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


TEST_RUNTIME_DIR = Path(tempfile.mkdtemp(prefix="beichen-agent-tests-"))
TEST_DATABASE_PATH = TEST_RUNTIME_DIR / "data" / "test.db"
TEST_UPLOAD_DIR = TEST_RUNTIME_DIR / "uploads"
TEST_VECTOR_STORE_DIR = TEST_RUNTIME_DIR / "vector_store"
TEST_LOG_DIR = TEST_RUNTIME_DIR / "logs"
TEST_INVITE_CODE = "111111"
TEST_ACCESS_HEADER = "X-Beichen-Access"
TEST_CLIENT_A = "test-client-a"
TEST_CLIENT_B = "test-client-b"


def _prepare_test_environment() -> None:
    TEST_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    TEST_VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
    TEST_LOG_DIR.mkdir(parents=True, exist_ok=True)
    TEST_DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    os.environ.update(
        {
            "APP_NAME": "Beichen Agent Test Backend",
            "APP_INVITE_CODES": TEST_INVITE_CODE,
            "APP_ACCESS_PASSWORD": "",
            "APP_ACCESS_HEADER": TEST_ACCESS_HEADER,
            "LLM_PROVIDER": "mock",
            "LLM_MODEL": "mock-chat",
            "EMBEDDING_PROVIDER": "mock",
            "EMBEDDING_MODEL": "mock-embedding",
            "EMBEDDING_DIMENSION": "16",
            "DATABASE_PATH": str(TEST_DATABASE_PATH),
            "DATABASE_URL": f"sqlite:///{TEST_DATABASE_PATH.as_posix()}",
            "UPLOAD_DIR": str(TEST_UPLOAD_DIR),
            "VECTOR_STORE_DIR": str(TEST_VECTOR_STORE_DIR),
            "LOG_TO_FILE": "false",
            "LOG_DIR": str(TEST_LOG_DIR),
        }
    )


_prepare_test_environment()

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers() -> dict[str, str]:
    return {
        TEST_ACCESS_HEADER: TEST_INVITE_CODE,
        "X-Beichen-Client-Id": TEST_CLIENT_A,
    }


@pytest.fixture
def client_b_headers() -> dict[str, str]:
    return {
        TEST_ACCESS_HEADER: TEST_INVITE_CODE,
        "X-Beichen-Client-Id": TEST_CLIENT_B,
    }

