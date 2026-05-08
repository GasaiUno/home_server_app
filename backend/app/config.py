from functools import lru_cache
from os import getenv

from pydantic import BaseModel

from .models import ServiceItem


APP_NAME = "Home Server App"
APP_VERSION = "0.1.1"


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


def _split_origins(value: str) -> list[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        home_app_token=getenv("HOME_APP_TOKEN", ""),
        n8n_yt_webhook=getenv("N8N_YT_WEBHOOK", "http://n8n:5678/webhook/yt"),
        n8n_magnet_webhook=getenv("N8N_MAGNET_WEBHOOK", "http://n8n:5678/webhook/magnet"),
        cors_origins=_split_origins(getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8091")),
        services=DEFAULT_SERVICES,
    )
