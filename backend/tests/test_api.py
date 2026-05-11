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
    assert payload["version"] == "0.2.3"
    assert isinstance(payload["uptime_seconds"], int)
    assert payload["server_time"]


def test_services_requires_token_and_returns_configured_services(client):
    response = client.get("/api/services", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 200
    assert {service["id"] for service in payload["services"]} >= {"jellyfin", "navidrome", "qbittorrent"}
    assert all(service["url"].startswith("http://10.8.1.5:") for service in payload["services"])
    assert all({"name", "url", "description"} <= set(service) for service in payload["services"])


def test_services_include_home_mode_metadata_without_breaking_existing_fields(client):
    response = client.get("/api/services", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    jellyfin = next(service for service in payload["services"] if service["id"] == "jellyfin")

    assert response.status_code == 200
    assert jellyfin["name"] == "Фильмы"
    assert jellyfin["description"] == "Jellyfin — фильмы и сериалы"
    assert jellyfin["url"] == "http://10.8.1.5:8096"
    assert jellyfin["icon"] == "film"
    assert jellyfin["accent"] == "purple"
    assert jellyfin["category"] == "media"
    assert jellyfin["health_url"] == "http://jellyfin:8096"


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


def test_admin_metrics_requires_token(client):
    response = client.get("/api/admin/metrics")

    assert response.status_code == 401


def test_admin_metrics_returns_server_sections(client):
    response = client.get("/api/admin/metrics", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 200
    assert {"cpu", "memory", "swap", "disk", "uptime", "temperature"} <= set(payload)
    assert isinstance(payload["cpu"]["percent"], int | float)
    assert "root" in payload["disk"]
    assert payload["uptime"]["backend_uptime_seconds"] >= 0


def test_admin_docker_returns_container_list(client):
    response = client.get("/api/admin/docker", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 200
    assert "containers" in payload
    assert isinstance(payload["containers"], list)


def test_admin_services_health_returns_service_checks(client):
    response = client.get("/api/admin/services-health", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 200
    assert "services" in payload
    assert {service["id"] for service in payload["services"]} >= {"jellyfin", "navidrome"}
    assert all("response_time_ms" in service for service in payload["services"])
    assert all("checked_url" in service for service in payload["services"])


def test_admin_services_registry_requires_token(client):
    response = client.get("/api/admin/services-registry")

    assert response.status_code == 401


def test_admin_services_registry_returns_whitelist(client):
    response = client.get("/api/admin/services-registry", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["ok"] is True
    service_keys = {service["key"] for service in payload["data"]["services"]}
    assert {"jellyfin", "qbittorrent", "n8n", "homeapp-backend"} <= service_keys


def test_admin_services_registry_rejects_unknown_service(client):
    response = client.get("/api/admin/services-registry/unknown", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 404
    assert payload["ok"] is False
    assert payload["error"]["code"] == "SERVICE_NOT_ALLOWED"


def test_admin_events_returns_events_and_telegram_status(client):
    response = client.get("/api/admin/events", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 200
    assert "events" in payload
    assert "telegram" in payload
    assert payload["telegram"]["configured"] is False


def test_admin_test_alert_without_telegram_config_does_not_fail(client):
    response = client.post("/api/admin/alerts/test", headers={"X-Home-Token": "test-token"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] in {"sent", "disabled"}
