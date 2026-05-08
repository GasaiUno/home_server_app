import logging
from datetime import datetime, timezone
from time import monotonic

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .config import APP_NAME, APP_VERSION, Settings, get_settings
from .models import MagnetRequest, ServicesResponse, StatusResponse, WebhookResponse, YoutubeRequest
from .services import post_magnet_webhook, post_youtube_webhook

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

started_at = monotonic()
app = FastAPI(title=APP_NAME, version=APP_VERSION)
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["X-Home-Token", "Content-Type"],
)


def require_token(
    x_home_token: str | None = Header(default=None, alias="X-Home-Token"),
    current_settings: Settings = Depends(get_settings),
) -> Settings:
    if not current_settings.home_app_token or x_home_token != current_settings.home_app_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing token",
        )
    return current_settings


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/status", response_model=StatusResponse)
def status_endpoint(_: Settings = Depends(require_token)) -> StatusResponse:
    return StatusResponse(
        status="ok",
        app=APP_NAME,
        version=APP_VERSION,
        uptime_seconds=int(monotonic() - started_at),
        server_time=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/api/services", response_model=ServicesResponse)
def services_endpoint(current_settings: Settings = Depends(require_token)) -> ServicesResponse:
    return ServicesResponse(services=current_settings.services)


@app.post("/api/youtube", response_model=WebhookResponse)
async def youtube_endpoint(
    payload: YoutubeRequest,
    current_settings: Settings = Depends(require_token),
) -> WebhookResponse:
    return await post_youtube_webhook(payload, current_settings.n8n_yt_webhook)


@app.post("/api/magnet", response_model=WebhookResponse)
async def magnet_endpoint(
    payload: MagnetRequest,
    current_settings: Settings = Depends(require_token),
) -> WebhookResponse:
    return await post_magnet_webhook(payload, current_settings.n8n_magnet_webhook)
