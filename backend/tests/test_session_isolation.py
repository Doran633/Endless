def _create_session(client, headers, title):
    response = client.post(
        "/api/v1/chat/sessions",
        headers=headers,
        json={"title": title, "mode": "chat"},
    )

    assert response.status_code == 200
    return response.json()["data"]["id"]


def test_session_list_is_isolated_by_client_id(client, auth_headers, client_b_headers):
    session_id = _create_session(client, auth_headers, "Client A Session")

    client_a_sessions = client.get("/api/v1/chat/sessions", headers=auth_headers).json()["data"][
        "sessions"
    ]
    client_b_sessions = client.get(
        "/api/v1/chat/sessions", headers=client_b_headers
    ).json()["data"]["sessions"]

    assert any(item["id"] == session_id for item in client_a_sessions)
    assert all(item["id"] != session_id for item in client_b_sessions)


def test_client_cannot_read_or_delete_another_clients_session(
    client, auth_headers, client_b_headers
):
    session_id = _create_session(client, auth_headers, "Private Session")

    blocked_read = client.get(
        f"/api/v1/chat/sessions/{session_id}/messages",
        headers=client_b_headers,
    )
    assert blocked_read.status_code == 404

    blocked_delete = client.delete(
        f"/api/v1/chat/sessions/{session_id}",
        headers=client_b_headers,
    )
    assert blocked_delete.status_code == 404

    still_visible = client.get("/api/v1/chat/sessions", headers=auth_headers).json()["data"][
        "sessions"
    ]
    assert any(item["id"] == session_id for item in still_visible)

    deleted = client.delete(f"/api/v1/chat/sessions/{session_id}", headers=auth_headers)
    assert deleted.status_code == 200
    assert deleted.json()["data"]["deleted"] is True

