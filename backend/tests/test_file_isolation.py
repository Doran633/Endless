from io import BytesIO


def _upload_text_file(client, headers, filename="sample.txt") -> str:
    response = client.post(
        "/api/v1/files",
        headers=headers,
        files={"file": (filename, BytesIO(b"hello from client"), "text/plain")},
    )

    assert response.status_code == 200
    return response.json()["data"]["id"]


def test_file_list_is_isolated_by_client_id(client, auth_headers, client_b_headers):
    file_id = _upload_text_file(client, auth_headers, "client-a-file.txt")

    client_a_files = client.get("/api/v1/files", headers=auth_headers).json()["data"]["files"]
    client_b_files = client.get("/api/v1/files", headers=client_b_headers).json()["data"]["files"]

    assert any(item["id"] == file_id for item in client_a_files)
    assert all(item["id"] != file_id for item in client_b_files)


def test_client_cannot_delete_another_clients_file(client, auth_headers, client_b_headers):
    file_id = _upload_text_file(client, auth_headers, "delete-isolation.txt")

    blocked = client.delete(f"/api/v1/files/{file_id}", headers=client_b_headers)
    assert blocked.status_code == 404

    still_visible = client.get("/api/v1/files", headers=auth_headers).json()["data"]["files"]
    assert any(item["id"] == file_id for item in still_visible)

    deleted = client.delete(f"/api/v1/files/{file_id}", headers=auth_headers)
    assert deleted.status_code == 200
    assert deleted.json()["data"]["deleted"] is True

