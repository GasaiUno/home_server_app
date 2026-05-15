import logging

import docker
from docker.errors import DockerException, NotFound

from .admin_services import ensure_service_action_allowed, require_admin_service
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


def run_admin_service_action(name: str, action: str, confirm: bool) -> dict:
    service = ensure_service_action_allowed(name, action)
    if not confirm:
        raise ApiError(
            code="SERVICE_ACTION_CONFIRM_REQUIRED",
            message="Service action requires explicit confirmation",
            details={"service": service.key, "action": action},
            status_code=409,
        )

    _, container = _get_container_for_service(name)
    try:
        if action == "restart":
            container.restart(timeout=10)
        elif action == "start":
            container.start()
        elif action == "stop":
            container.stop(timeout=10)
        else:
            raise ApiError(
                code="SERVICE_ACTION_UNKNOWN",
                message="Unknown service action",
                details={"service": service.key, "action": action},
                status_code=400,
            )
    except DockerException as exc:
        raise ApiError(
            code="DOCKER_ACTION_FAILED",
            message="Docker action failed",
            details={"service": service.key, "action": action},
            status_code=502,
        ) from exc

    return {
        "status": "ok",
        "message": f"{service.display_name}: {action} requested",
        "service": service.key,
        "action": action,
    }
