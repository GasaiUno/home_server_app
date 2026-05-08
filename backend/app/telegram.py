import logging

import httpx

from .config import Settings

logger = logging.getLogger(__name__)


async def send_telegram_message(settings: Settings, text: str) -> bool:
    if not settings.alerts_enabled or not settings.telegram_configured:
        return False

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url,
                json={
                    "chat_id": settings.telegram_admin_id,
                    "text": text,
                    "disable_web_page_preview": True,
                },
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Telegram notification failed: %s", exc)
        return False

    return True
