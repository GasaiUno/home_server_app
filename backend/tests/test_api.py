import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setenv("HOME_APP_TOKEN", "test-token")
    from app.main import app

    return TestClient(app)


def test_health_does_not_require_token(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_status_requires_token(client):
    response = client.get("/api/status")

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or missing token"


def test_status_returns_backend_metadata_with_token(client):
    response = client.get("/api/status", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "ok"
    assert payload["app"] == "Home Server App"
    assert payload["version"] == "0.1.0"
    assert isinstance(payload["uptime_seconds"], int)
    assert payload["server_time"]


def test_services_requires_token_and_returns_configured_services(client):
    response = client.get("/api/services", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 200
    assert {service["name"] for service in payload["services"]} >= {
        "Jellyfin",
        "Navidrome",
        "qBittorrent",
    }
    assert all(service["url"].startswith("http://10.8.1.5:") for service in payload["services"])


def test_youtube_rejects_non_http_url(client):
    response = client.post(
        "/api/youtube",
        headers={"X-Home-Token": "test-token"},
        json={"url": "ftp://example.com/video"},
    )

    assert response.status_code == 422


def test_magnet_rejects_non_magnet_url(client):
    response = client.post(
        "/api/magnet",
        headers={"X-Home-Token": "test-token"},
        json={"url": "https://example.com/file.torrent"},
    )

    assert response.status_code == 422
