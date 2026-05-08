from functools import lru_cache
from os import getenv
from pathlib import Path

from pydantic import BaseModel

from .models import ServiceItem


APP_NAME = "Home Server App"
APP_VERSION = "0.1.2"


DEFAULT_SERVICES = [
    ServiceItem(
        id="jellyfin",
        name="Фильмы",
        url="http://10.8.1.5:8096",
        description="Jellyfin — фильмы и сериалы",
        icon="film",
        accent="purple",
        category="media",
    ),
    ServiceItem(
        id="navidrome",
        name="Музыка",
        url="http://10.8.1.5:4533",
        description="Navidrome — музыкальная библиотека",
        icon="headphones",
        accent="teal",
        category="media",
    ),
    ServiceItem(
        id="file-browser",
        name="Файлы",
        url="http://10.8.1.5:8082",
        description="File Browser — доступ к файлам",
        icon="folder",
        accent="amber",
        category="storage",
    ),
    ServiceItem(
        id="qbittorrent",
        name="Торренты",
        url="http://10.8.1.5:8080",
        description="qBittorrent — загрузки",
        icon="cloud-download",
        accent="blue",
        category="downloads",
    ),
    ServiceItem(
        id="metube",
        name="YouTube",
        url="http://10.8.1.5:8081",
        description="Скачать видео или аудио",
        icon="youtube",
        accent="red",
        category="downloads",
    ),
    ServiceItem(
        id="n8n",
        name="Автоматизация",
        url="http://10.8.1.5:5678",
        description="n8n — сценарии и боты",
        icon="workflow",
        accent="pink",
        category="automation",
    ),
    ServiceItem(
        id="homepage",
        name="Homepage",
        url="http://10.8.1.5:3000",
        description="Домашняя стартовая страница",
        icon="home",
        accent="slate",
        category="system",
    ),
]


class Settings(BaseModel):
    home_app_token: str
    n8n_yt_webhook: str
    n8n_magnet_webhook: str
    cors_origins: list[str]
    services: list[ServiceItem]
    host_root_path: str
    host_proc_path: str
    host_sys_path: str
    home_data_path: str | None
    telegram_bot_token: str | None
    telegram_admin_id: str | None
    alerts_enabled: bool
    alert_cpu_percent: float
    alert_memory_percent: float
    alert_swap_percent: float
    alert_disk_percent: float
    alert_temperature_c: float
    alert_check_interval_seconds: int
    alert_cooldown_seconds: int
    events_path: Path

    @property
    def telegram_configured(self) -> bool:
        return bool(self.telegram_bot_token and self.telegram_admin_id)


def _split_origins(value: str) -> list[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


def _get_bool(name: str, default: bool) -> bool:
    value = getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _get_float(name: str, default: float) -> float:
    value = getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _get_int(name: str, default: int) -> int:
    value = getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _get_optional(name: str) -> str | None:
    value = getenv(name)
    return value if value else None


@lru_cache
def get_settings() -> Settings:
    return Settings(
        home_app_token=getenv("HOME_APP_TOKEN", ""),
        n8n_yt_webhook=getenv("N8N_YT_WEBHOOK", "http://n8n:5678/webhook/yt"),
        n8n_magnet_webhook=getenv("N8N_MAGNET_WEBHOOK", "http://n8n:5678/webhook/magnet"),
        cors_origins=_split_origins(getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8091")),
        services=DEFAULT_SERVICES,
        host_root_path=getenv("HOST_ROOT_PATH", "/"),
        host_proc_path=getenv("HOST_PROC_PATH", "/host/proc"),
        host_sys_path=getenv("HOST_SYS_PATH", "/host/sys"),
        home_data_path=_get_optional("HOME_DATA_PATH"),
        telegram_bot_token=_get_optional("TELEGRAM_BOT_TOKEN"),
        telegram_admin_id=_get_optional("TELEGRAM_ADMIN_ID"),
        alerts_enabled=_get_bool("ALERTS_ENABLED", True),
        alert_cpu_percent=_get_float("ALERT_CPU_PERCENT", 90),
        alert_memory_percent=_get_float("ALERT_MEMORY_PERCENT", 90),
        alert_swap_percent=_get_float("ALERT_SWAP_PERCENT", 70),
        alert_disk_percent=_get_float("ALERT_DISK_PERCENT", 90),
        alert_temperature_c=_get_float("ALERT_TEMPERATURE_C", 80),
        alert_check_interval_seconds=_get_int("ALERT_CHECK_INTERVAL_SECONDS", 60),
        alert_cooldown_seconds=_get_int("ALERT_COOLDOWN_SECONDS", 1800),
        events_path=Path(getenv("EVENTS_PATH", "app_data/events.json")),
    )
