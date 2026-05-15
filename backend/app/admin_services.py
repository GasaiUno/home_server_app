from typing import Literal

from pydantic import BaseModel

from .api_response import ApiError
from .audit import write_audit_event


class AdminServiceConfig(BaseModel):
    key: str
    display_name: str
    container_name: str
    url: str | None
    category: str
    allow_logs: bool
    allow_restart: bool
    allow_start: bool
    allow_stop: bool
    danger_level: Literal["low", "medium", "high"]


ADMIN_SERVICES: dict[str, AdminServiceConfig] = {
    "jellyfin": AdminServiceConfig(
        key="jellyfin",
        display_name="Jellyfin",
        container_name="jellyfin",
        url="http://10.8.1.5:8096",
        category="media",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="low",
    ),
    "navidrome": AdminServiceConfig(
        key="navidrome",
        display_name="Navidrome",
        container_name="navidrome",
        url="http://10.8.1.5:4533",
        category="media",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="low",
    ),
    "qbittorrent": AdminServiceConfig(
        key="qbittorrent",
        display_name="qBittorrent",
        container_name="qbittorrent",
        url="http://10.8.1.5:8080",
        category="downloads",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="medium",
    ),
    "metube": AdminServiceConfig(
        key="metube",
        display_name="MeTube",
        container_name="metube",
        url="http://10.8.1.5:8081",
        category="downloads",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="low",
    ),
    "n8n": AdminServiceConfig(
        key="n8n",
        display_name="n8n",
        container_name="n8n",
        url="http://10.8.1.5:5678",
        category="automation",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="medium",
    ),
    "homepage": AdminServiceConfig(
        key="homepage",
        display_name="Homepage",
        container_name="homepage",
        url="http://10.8.1.5:3000",
        category="system",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="low",
    ),
    "filebrowser": AdminServiceConfig(
        key="filebrowser",
        display_name="File Browser",
        container_name="filebrowser",
        url="http://10.8.1.5:8082",
        category="storage",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="medium",
    ),
    "prowlarr": AdminServiceConfig(
        key="prowlarr",
        display_name="Prowlarr",
        container_name="prowlarr",
        url="http://10.8.1.5:9696",
        category="downloads",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="medium",
    ),
    "radarr": AdminServiceConfig(
        key="radarr",
        display_name="Radarr",
        container_name="radarr",
        url="http://10.8.1.5:7878",
        category="downloads",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="medium",
    ),
    "sonarr": AdminServiceConfig(
        key="sonarr",
        display_name="Sonarr",
        container_name="sonarr",
        url="http://10.8.1.5:8989",
        category="downloads",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="medium",
    ),
    "syncthing": AdminServiceConfig(
        key="syncthing",
        display_name="Syncthing",
        container_name="syncthing",
        url="http://10.8.1.5:8384",
        category="sync",
        allow_logs=True,
        allow_restart=True,
        allow_start=True,
        allow_stop=True,
        danger_level="medium",
    ),
    "homeapp-frontend": AdminServiceConfig(
        key="homeapp-frontend",
        display_name="Home App Frontend",
        container_name="homeapp-frontend",
        url="http://10.8.1.5:8091",
        category="app",
        allow_logs=True,
        allow_restart=True,
        allow_start=False,
        allow_stop=False,
        danger_level="high",
    ),
    "homeapp-backend": AdminServiceConfig(
        key="homeapp-backend",
        display_name="Home App Backend",
        container_name="homeapp-backend",
        url="http://10.8.1.5:8090",
        category="app",
        allow_logs=True,
        allow_restart=False,
        allow_start=False,
        allow_stop=False,
        danger_level="high",
    ),
}

SERVICE_ACTIONS = {"start", "stop", "restart"}


def list_admin_services_config() -> list[AdminServiceConfig]:
    return list(ADMIN_SERVICES.values())


def get_admin_service(name: str) -> AdminServiceConfig | None:
    return ADMIN_SERVICES.get(name)


def require_admin_service(name: str) -> AdminServiceConfig:
    service = get_admin_service(name)
    if service is None:
        write_audit_event(
            action="service.registry.denied",
            service=name,
            result="forbidden",
            details={"code": "SERVICE_NOT_ALLOWED"},
        )
        raise ApiError(
            code="SERVICE_NOT_ALLOWED",
            message="Service is not allowed for admin operations",
            details={"service": name},
            status_code=404,
        )
    return service


def ensure_service_action_allowed(name: str, action: str) -> AdminServiceConfig:
    if action not in SERVICE_ACTIONS:
        raise ApiError(
            code="SERVICE_ACTION_UNKNOWN",
            message="Unknown service action",
            details={"service": name, "action": action},
            status_code=400,
        )

    service = require_admin_service(name)
    allowed = {
        "start": service.allow_start,
        "stop": service.allow_stop,
        "restart": service.allow_restart,
    }[action]
    if not allowed:
        write_audit_event(
            action=f"service.{action}.denied",
            service=service.key,
            result="forbidden",
            details={"code": "SERVICE_ACTION_NOT_ALLOWED"},
        )
        raise ApiError(
            code="SERVICE_ACTION_NOT_ALLOWED",
            message="Action is not allowed for this service",
            details={"service": service.key, "action": action},
            status_code=403,
        )
    return service
