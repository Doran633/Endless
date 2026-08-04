def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_config_returns_non_sensitive_runtime_summary(client):
    response = client.get("/health/config")

    assert response.status_code == 200
    body = response.json()

    assert body["app_name"] == "Beichen Agent Test Backend"
    assert body["llm_provider"] == "mock"
    assert body["embedding_provider"] == "mock"
    assert body["embedding_dimension"] == 16
    assert body["access_control"]["enabled"] is True
    assert body["access_control"]["mode"] == "invite_codes"
    assert body["access_control"]["invite_code_count"] == 1

    serialized = str(body)
    assert "OPENAI_API_KEY" not in serialized
    assert "EMBEDDING_API_KEY" not in serialized
    assert "111111" not in serialized
    assert "APP_INVITE_CODES" not in serialized

