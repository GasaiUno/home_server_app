import logging

import docker
from docker.errors import DockerException, NotFound

from .admin_services import require_admin_service
from .api_response import ApiError

logger = logging.getLogger(__name__)


def clamp_log_tail(tail: int = 200) -> int:
    return max(10, min(int(tail), 1000))


def get_docker_client():
    try:
        return docker.from_env()
    except DockerException as exc:
        logger.info("Docker unavailable: %s", exc)
        raise ApiError(
            code="DOCKER_UNAVAILABLE",
            message="Docker API is unavailable",
            status_code=503,
        ) from exc


def _get_container_for_service(name: str):
    service = require_admin_service(name)
    client = get_docker_client()
    try:
        return service, client.containers.get(service.container_name)
    except NotFound as exc:
        raise ApiError(
            code="SERVICE_CONTAINER_NOT_FOUND",
            message="Service container was not found",
            details={"service": service.key},
            status_code=404,
        ) from exc
    except DockerException as exc:
        raise ApiError(
            code="DOCKER_UNAVAILABLE",
            message="Docker API is unavailable",
            status_code=503,
        ) from exc


def get_container_status_for_service(name: str) -> dict:
    service, container = _get_container_for_service(name)
    state = container.attrs.get("State", {})
    return {
        "key": service.key,
        "container_name": service.container_name,
        "status": state.get("Status") or container.status,
        "health": state.get("Health", {}).get("Status"),
    }


def list_admin_services_status() -> list[dict]:
    statuses = []
    for service_name in ("jellyfin", "navidrome", "qbittorrent", "metube", "n8n", "homepage", "filebrowser"):
        try:
            statuses.append(get_container_status_for_service(service_name))
        except ApiError as exc:
            statuses.append({"key": service_name, "status": "unknown", "error": exc.code})
    return statuses


def get_admin_service_logs(name: str, tail: int = 200) -> list[str]:
    service = require_admin_service(name)
    if not service.allow_logs:
        raise ApiError(
            code="SERVICE_LOGS_NOT_ALLOWED",
            message="Logs are not allowed for this service",
            details={"service": service.key},
            status_code=403,
        )
    _, container = _get_container_for_service(name)
    try:
        raw_logs = container.logs(tail=clamp_log_tail(tail), stream=False)
    except DockerException as exc:
        raise ApiError(
            code="DOCKER_UNAVAILABLE",
            message="Docker API is unavailable",
            status_code=503,
        ) from exc
    text = raw_logs.decode("utf-8", errors="replace") if isinstance(raw_logs, bytes) else str(raw_logs)
    return text.splitlines()
