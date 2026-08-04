from .conftest import TEST_ACCESS_HEADER, TEST_INVITE_CODE


def test_api_requires_client_id(client):
    response = client.get(
        "/api/v1/files",
        headers={TEST_ACCESS_HEADER: TEST_INVITE_CODE},
    )

    assert response.status_code == 400
    body = response.json()
    assert body["code"] == 51001
    assert "request_id" in body


def test_api_rejects_too_long_client_id(client):
    response = client.get(
        "/api/v1/files",
        headers={
            TEST_ACCESS_HEADER: TEST_INVITE_CODE,
            "X-Beichen-Client-Id": "x" * 129,
        },
    )

    assert response.status_code == 400
    assert response.json()["code"] == 51001

