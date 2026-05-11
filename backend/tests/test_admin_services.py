import pytest

from app.admin_services import get_admin_service, list_admin_services_config, require_admin_service
from app.docker_admin import clamp_log_tail


def test_unknown_service_rejected_with_controlled_code():
    with pytest.raises(Exception) as exc_info:
        require_admin_service("unknown")

    assert getattr(exc_info.value, "code", None) == "SERVICE_NOT_ALLOWED"


def test_homeapp_backend_is_protected_from_service_actions():
    service = get_admin_service("homeapp-backend")

    assert service is not None
    assert service.allow_stop is False
    assert service.allow_restart is False
    assert service.allow_start is False


def test_log_tail_is_clamped_to_safe_bounds():
    assert clamp_log_tail(1001) == 1000
    assert clamp_log_tail(1) == 10
    assert clamp_log_tail(200) == 200


def test_registry_contains_expected_services():
    services = {service.key for service in list_admin_services_config()}

    assert {"jellyfin", "qbittorrent", "n8n", "homeapp-backend"} <= services


def test_registry_services_have_container_names():
    assert all(service.container_name for service in list_admin_services_config())
