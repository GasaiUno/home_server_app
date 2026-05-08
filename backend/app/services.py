import logging

import httpx
from fastapi import HTTPException

from .models import MagnetRequest, WebhookResponse, YoutubeRequest

logger = logging.getLogger(__name__)


async def post_youtube_webhook(payload: YoutubeRequest, webhook_url: str) -> WebhookResponse:
    return await _post_webhook(webhook_url, payload.model_dump(), timeout=60.0)


async def post_magnet_webhook(payload: MagnetRequest, webhook_url: str) -> WebhookResponse:
    return await _post_webhook(webhook_url, payload.model_dump(), timeout=30.0)


async def _post_webhook(url: str, payload: dict[str, str], timeout: float) -> WebhookResponse:
    logger.info("Posting webhook request to %s", url)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.warning("Webhook returned HTTP %s", exc.response.status_code)
        raise HTTPException(
            status_code=502,
            detail={"message": "Webhook request failed", "status_code": exc.response.status_code},
        ) from exc
    except httpx.HTTPError as exc:
        logger.warning("Webhook request error: %s", exc)
        raise HTTPException(status_code=502, detail={"message": "Webhook request error"}) from exc

    return WebhookResponse(status="ok", message="Request accepted")
