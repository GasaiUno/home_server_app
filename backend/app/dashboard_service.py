from .config import Settings
from .file_service import recent_youtube_downloads
from .integrations.qbittorrent import QBittorrentClient
from .models import DashboardSummaryResponse
from .monitoring import check_services_health, collect_server_metrics


async def get_dashboard_summary(settings: Settings, backend_started_at: float, backend_started_at_iso: str) -> DashboardSummaryResponse:
    metrics = collect_server_metrics(settings, backend_started_at, backend_started_at_iso)
    try:
        torrents = await QBittorrentClient(settings).get_torrents()
    except Exception:  # noqa: BLE001
        torrents = []
    try:
        health = await check_services_health(settings)
    except Exception:  # noqa: BLE001
        health = None
    recent = recent_youtube_downloads(settings, limit=5)
    downloading = [item for item in torrents if item.state in {"downloading", "stalledDL", "metaDL", "forcedDL"}]
    active = [item for item in torrents if item.dlspeed > 0 or item.upspeed > 0 or item.state not in {"pausedDL", "pausedUP"}]
    online = sum(1 for service in health.services if service.online) if health else 0
    offline = sum(1 for service in health.services if not service.online) if health else 0
    return DashboardSummaryResponse(
        server={
            "online": True,
            "disk_percent": metrics.disk.root.percent,
            "memory_percent": metrics.memory.percent,
            "cpu_percent": metrics.cpu.percent,
        },
        torrents={
            "active": len(active),
            "downloading": len(downloading),
            "total_download_speed": sum(item.dlspeed for item in torrents),
            "total_upload_speed": sum(item.upspeed for item in torrents),
        },
        youtube={"recent_count": len(recent)},
        services={"online": online, "offline": offline},
    )
