from .admin_services import get_admin_service
from .docker_admin import get_container_status_for_service


MEDIA_SERVICE_KEYS = ("jellyfin", "navidrome")


def get_media_overview() -> dict:
    services = []
    for key in MEDIA_SERVICE_KEYS:
        config = get_admin_service(key)
        if config is None:
            continue
        status = None
        online = False
        try:
            container = get_container_status_for_service(key)
            status = container.get("status")
            online = status == "running"
        except Exception:
            status = "unknown"
        services.append(
            {
                "key": config.key,
                "name": config.display_name,
                "url": config.url,
                "online": online,
                "status": status,
            }
        )
    return {"services": services}
