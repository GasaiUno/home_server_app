import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from time import monotonic

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .alerts import AlertMonitor
from .config import APP_NAME, APP_VERSION, Settings, get_settings
from .events import EventStore
from .models import (
    AlertTestResponse,
    DockerContainersResponse,
    EventsResponse,
    MagnetRequest,
    ServerMetricsResponse,
    ServicesHealthResponse,
    ServicesResponse,
    StatusResponse,
    TelegramStatus,
    WebhookResponse,
    YoutubeRequest,
)
from .monitoring import check_services_health, collect_server_metrics, get_docker_containers
from .services import post_magnet_webhook, post_youtube_webhook

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

started_at = monotonic()
started_at_iso = datetime.now(timezone.utc).isoformat()
settings = get_settings()
event_store = EventStore(settings.events_path)
alert_monitor = AlertMonitor(settings, event_store, time.monotonic(), started_at_iso)


@asynccontextmanager
async def lifespan(_: FastAPI):
    alert_monitor.start()
    try:
        yield
    finally:
        await alert_monitor.stop()


app = FastAPI(title=APP_NAME, version=APP_VERSION, lifespan=lifespan)

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


@app.get("/api/admin/metrics", response_model=ServerMetricsResponse)
def admin_metrics_endpoint(current_settings: Settings = Depends(require_token)) -> ServerMetricsResponse:
    return collect_server_metrics(current_settings, started_at, started_at_iso)


@app.get("/api/admin/docker", response_model=DockerContainersResponse)
def admin_docker_endpoint(_: Settings = Depends(require_token)) -> DockerContainersResponse:
    return get_docker_containers()


@app.get("/api/admin/services-health", response_model=ServicesHealthResponse)
async def admin_services_health_endpoint(current_settings: Settings = Depends(require_token)) -> ServicesHealthResponse:
    return await check_services_health(current_settings)


@app.get("/api/admin/events", response_model=EventsResponse)
def admin_events_endpoint(current_settings: Settings = Depends(require_token)) -> EventsResponse:
    return EventsResponse(
        events=event_store.list_events(),
        telegram=TelegramStatus(enabled=current_settings.alerts_enabled, configured=current_settings.telegram_configured),
    )


@app.post("/api/admin/alerts/test", response_model=AlertTestResponse)
async def admin_test_alert_endpoint(current_settings: Settings = Depends(require_token)) -> AlertTestResponse:
    sent = await alert_monitor.send_test_alert()
    configured = current_settings.telegram_configured
    enabled = current_settings.alerts_enabled
    if sent:
        return AlertTestResponse(
            status="sent",
            message="Тестовое уведомление отправлено",
            telegram=TelegramStatus(enabled=enabled, configured=configured),
        )
    return AlertTestResponse(
        status="disabled",
        message="Telegram alerts не настроены или отключены",
        telegram=TelegramStatus(enabled=enabled, configured=configured),
    )


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
