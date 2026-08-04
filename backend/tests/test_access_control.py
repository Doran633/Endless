from .conftest import TEST_ACCESS_HEADER, TEST_INVITE_CODE


def test_api_requires_invite_code(client):
    response = client.get("/api/v1/files", headers={"X-Beichen-Client-Id": "client-a"})

    assert response.status_code == 401
    assert response.json()["code"] == 41001


def test_api_rejects_wrong_invite_code(client):
    response = client.get(
        "/api/v1/files",
        headers={
            TEST_ACCESS_HEADER: "000000",
            "X-Beichen-Client-Id": "client-a",
        },
    )

    assert response.status_code == 401
    assert response.json()["code"] == 41001


def test_api_accepts_correct_invite_code(client):
    response = client.get(
        "/api/v1/files",
        headers={
            TEST_ACCESS_HEADER: TEST_INVITE_CODE,
            "X-Beichen-Client-Id": "client-a",
        },
    )

    assert response.status_code == 200
    assert response.json()["code"] == 0


def test_health_does_not_require_invite_code(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

