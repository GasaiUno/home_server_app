import httpx

from ..config import Settings
from ..models import YoutubeRequest


async def add_youtube_download(settings: Settings, payload: YoutubeRequest) -> None:
    url = f"{settings.metube_url.rstrip('/')}/add"
    body = {
        "url": payload.url,
        "quality": payload.quality,
        "format": payload.format,
        "download_type": payload.download_type,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=body)
        response.raise_for_status()
