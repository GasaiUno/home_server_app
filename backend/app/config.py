from functools import lru_cache
from os import getenv

from pydantic import BaseModel

from .models import ServiceItem


APP_NAME = "Home Server App"
APP_VERSION = "0.1.0"


DEFAULT_SERVICES = [
    ServiceItem(name="Jellyfin", url="http://10.8.1.5:8096", description="Media server"),
    ServiceItem(name="Navidrome", url="http://10.8.1.5:4533", description="Music server"),
    ServiceItem(name="File Browser", url="http://10.8.1.5:8082", description="Files"),
    ServiceItem(name="qBittorrent", url="http://10.8.1.5:8080", description="Torrents"),
    ServiceItem(name="MeTube", url="http://10.8.1.5:8081", description="YouTube downloads"),
    ServiceItem(name="n8n", url="http://10.8.1.5:5678", description="Automations"),
    ServiceItem(name="Homepage", url="http://10.8.1.5:3000", description="Server homepage"),
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
