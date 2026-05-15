import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from time import monotonic

from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .alerts import AlertMonitor
from .admin_services import list_admin_services_config, require_admin_service
from .api_response import ApiError, api_error_response, success_response
from .audit import list_audit_events, write_audit_event
from .config import APP_NAME, APP_VERSION, Settings, get_settings
from .dashboard_service import get_dashboard_summary
from .docker_admin import get_admin_service_logs, run_admin_service_action
from .events import EventStore
from .file_service import delete_path, list_files, mkdir, recent_youtube_downloads, safe_resolve_path, upload_file
from .integrations.jellyfin import get_jellyfin_items, get_jellyfin_libraries
from .integrations.metube import add_youtube_download
from .integrations.navidrome import get_navidrome_albums, get_navidrome_artists, get_navidrome_recent, search_navidrome
from .integrations.qbittorrent import QBittorrentClient
from .media_overview import get_media_overview
from .models import (
    AlertTestResponse,
    ActionResponse,
    AddMagnetRequest,
    AuditEventsResponse,
    ServiceActionRequest,
    ServiceActionResponse,
    DashboardSummaryResponse,
    DeleteFileRequest,
    DockerContainersResponse,
    EventsResponse,
    FileItem,
    FilesListResponse,
    MagnetRequest,
    MediaOverviewResponse,
    JellyfinItemsResponse,
    JellyfinLibrariesResponse,
    MusicAlbumsResponse,
    MusicArtistsResponse,
    MusicSearchResponse,
    MkdirRequest,
    ServerMetricsResponse,
    ServicesHealthResponse,
    ServicesResponse,
    StatusResponse,
    TaskHistoryResponse,
    TelegramStatus,
    TorrentsResponse,
    WebhookResponse,
    YoutubeRequest,
    YoutubeDownloadsResponse,
)
from .monitoring import check_services_health, collect_server_metrics, get_docker_containers
from .services import post_magnet_webhook, post_youtube_webhook
from .task_history import TaskHistoryStore
from .telegram import send_telegram_message

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

started_at = monotonic()
started_at_iso = datetime.now(timezone.utc).isoformat()
settings = get_settings()
event_store = EventStore(settings.events_path)
task_history = TaskHistoryStore(Path("app_data/tasks.jsonl"))
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


def public_service_url(service_id: str) -> str | None:
    for service in settings.services:
        if service.id == service_id:
            return service.url
    return None


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


@app.get("/api/dashboard/summary", response_model=DashboardSummaryResponse)
async def dashboard_summary_endpoint(current_settings: Settings = Depends(require_token)) -> DashboardSummaryResponse:
    return await get_dashboard_summary(current_settings, started_at, started_at_iso)


@app.get("/api/media/overview", response_model=MediaOverviewResponse)
def media_overview_endpoint(_: Settings = Depends(require_token)) -> MediaOverviewResponse:
    return MediaOverviewResponse(**get_media_overview())


@app.get("/api/media/jellyfin/libraries", response_model=JellyfinLibrariesResponse)
async def jellyfin_libraries_endpoint(current_settings: Settings = Depends(require_token)):
    try:
        return await get_jellyfin_libraries(current_settings)
    except ApiError as exc:
        return api_error_response(exc)


@app.get("/api/media/jellyfin/recent", response_model=JellyfinItemsResponse)
async def jellyfin_recent_endpoint(
    type: str | None = Query(default=None),  # noqa: A002
    limit: int = Query(default=24, ge=1, le=50),
    current_settings: Settings = Depends(require_token),
):
    try:
        return await get_jellyfin_items(current_settings, public_service_url("jellyfin"), item_type=type, limit=limit)
    except ApiError as exc:
        return api_error_response(exc)


@app.get("/api/media/jellyfin/items", response_model=JellyfinItemsResponse)
async def jellyfin_items_endpoint(
    type: str | None = Query(default=None),  # noqa: A002
    parent_id: str | None = Query(default=None),
    mode: str | None = Query(default=None),
    limit: int = Query(default=24, ge=1, le=50),
    current_settings: Settings = Depends(require_token),
):
    try:
        return await get_jellyfin_items(
            current_settings,
            public_service_url("jellyfin"),
            item_type=type,
            parent_id=parent_id,
            mode=mode,
            limit=limit,
        )
    except ApiError as exc:
        return api_error_response(exc)


@app.get("/api/media/jellyfin/search", response_model=JellyfinItemsResponse)
async def jellyfin_search_endpoint(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=24, ge=1, le=50),
    current_settings: Settings = Depends(require_token),
):
    try:
        return await get_jellyfin_items(current_settings, public_service_url("jellyfin"), search=q, limit=limit)
    except ApiError as exc:
        return api_error_response(exc)


@app.get("/api/music/recent", response_model=MusicAlbumsResponse)
async def music_recent_endpoint(
    limit: int = Query(default=24, ge=1, le=50),
    current_settings: Settings = Depends(require_token),
):
    try:
        return await get_navidrome_recent(current_settings, public_service_url("navidrome"), limit)
    except ApiError as exc:
        return api_error_response(exc)


@app.get("/api/music/artists", response_model=MusicArtistsResponse)
async def music_artists_endpoint(current_settings: Settings = Depends(require_token)):
    try:
        return await get_navidrome_artists(current_settings)
    except ApiError as exc:
        return api_error_response(exc)


@app.get("/api/music/albums", response_model=MusicAlbumsResponse)
async def music_albums_endpoint(
    limit: int = Query(default=50, ge=1, le=100),
    current_settings: Settings = Depends(require_token),
):
    try:
        return await get_navidrome_albums(current_settings, public_service_url("navidrome"), limit)
    except ApiError as exc:
        return api_error_response(exc)


@app.get("/api/music/search", response_model=MusicSearchResponse)
async def music_search_endpoint(
    q: str = Query(..., min_length=1),
    current_settings: Settings = Depends(require_token),
):
    try:
        return await search_navidrome(current_settings, public_service_url("navidrome"), q)
    except ApiError as exc:
        return api_error_response(exc)


@app.get("/api/torrents", response_model=TorrentsResponse)
async def torrents_endpoint(current_settings: Settings = Depends(require_token)) -> TorrentsResponse:
    items = await QBittorrentClient(current_settings).get_torrents()
    return TorrentsResponse(items=items)


@app.post("/api/torrents/add-magnet", response_model=ActionResponse)
async def torrents_add_magnet_endpoint(
    payload: AddMagnetRequest,
    current_settings: Settings = Depends(require_token),
) -> ActionResponse:
    try:
        await QBittorrentClient(current_settings).add_magnet(payload.url, payload.category)
    except Exception as exc:  # noqa: BLE001
        event_store.add_event("error", "magnet_error", "Ошибка добавления magnet", False)
        await send_telegram_message(current_settings, "❌ Ошибка добавления magnet")
        raise HTTPException(status_code=502, detail="Не удалось добавить magnet в qBittorrent") from exc
    event_store.add_event("info", "magnet_added", f"Magnet добавлен: {payload.url[:120]}", False)
    await send_telegram_message(current_settings, f"🧲 Magnet добавлен: {payload.url[:120]}")
    return ActionResponse(status="ok", message="Magnet добавлен")


@app.post("/api/torrents/upload", response_model=ActionResponse)
async def torrents_upload_endpoint(
    file: UploadFile = File(...),
    category: str | None = Form(default=None),
    current_settings: Settings = Depends(require_token),
) -> ActionResponse:
    if not (file.filename or "").endswith(".torrent"):
        raise HTTPException(status_code=400, detail="Нужен .torrent файл")
    with NamedTemporaryFile(delete=False, suffix=".torrent") as temp_file:
        temp_path = Path(temp_file.name)
        while chunk := await file.read(1024 * 1024):
            temp_file.write(chunk)
    try:
        await QBittorrentClient(current_settings).add_torrent_file(temp_path, category)
    finally:
        temp_path.unlink(missing_ok=True)
    event_store.add_event("info", "torrent_file_uploaded", f"Torrent файл загружен: {file.filename}", False)
    return ActionResponse(status="ok", message="Torrent файл отправлен")


@app.post("/api/torrents/{torrent_hash}/pause", response_model=ActionResponse)
async def torrent_pause_endpoint(torrent_hash: str, current_settings: Settings = Depends(require_token)) -> ActionResponse:
    await QBittorrentClient(current_settings).pause_torrent(torrent_hash)
    event_store.add_event("info", "torrent_paused", f"Torrent paused: {torrent_hash}", False)
    return ActionResponse(status="ok", message="Torrent paused")


@app.post("/api/torrents/{torrent_hash}/resume", response_model=ActionResponse)
async def torrent_resume_endpoint(torrent_hash: str, current_settings: Settings = Depends(require_token)) -> ActionResponse:
    await QBittorrentClient(current_settings).resume_torrent(torrent_hash)
    event_store.add_event("info", "torrent_resumed", f"Torrent resumed: {torrent_hash}", False)
    return ActionResponse(status="ok", message="Torrent resumed")


@app.delete("/api/torrents/{torrent_hash}", response_model=ActionResponse)
async def torrent_delete_endpoint(
    torrent_hash: str,
    delete_files: bool = Query(default=False),
    current_settings: Settings = Depends(require_token),
) -> ActionResponse:
    if delete_files and not current_settings.allow_file_delete:
        raise HTTPException(status_code=403, detail="Удаление файлов отключено")
    await QBittorrentClient(current_settings).delete_torrent(torrent_hash, delete_files)
    event_store.add_event("warning", "torrent_deleted", f"Torrent deleted: {torrent_hash}", False)
    return ActionResponse(status="ok", message="Torrent deleted")


@app.get("/api/youtube/downloads", response_model=YoutubeDownloadsResponse)
def youtube_downloads_endpoint(current_settings: Settings = Depends(require_token)) -> YoutubeDownloadsResponse:
    return YoutubeDownloadsResponse(items=recent_youtube_downloads(current_settings))


@app.get("/api/files", response_model=FilesListResponse)
def files_endpoint(path: str = Query(default="media"), current_settings: Settings = Depends(require_token)) -> FilesListResponse:
    return list_files(current_settings, path)


@app.get("/api/files/download")
def files_download_endpoint(path: str = Query(...), current_settings: Settings = Depends(require_token)) -> FileResponse:
    _, resolved = safe_resolve_path(current_settings, path)
    if not resolved.exists() or not resolved.is_file():
        raise HTTPException(status_code=404, detail="file not found")
    return FileResponse(resolved, filename=resolved.name)


@app.post("/api/files/upload", response_model=FileItem)
async def files_upload_endpoint(
    path: str = Form(...),
    file: UploadFile = File(...),
    current_settings: Settings = Depends(require_token),
) -> FileItem:
    item = await upload_file(current_settings, path, file)
    event_store.add_event("info", "file_uploaded", f"Файл загружен: {item.path}", False)
    return item


@app.post("/api/files/mkdir", response_model=ActionResponse)
def files_mkdir_endpoint(payload: MkdirRequest, current_settings: Settings = Depends(require_token)) -> ActionResponse:
    mkdir(current_settings, payload.path)
    event_store.add_event("info", "folder_created", f"Папка создана: {payload.path}", False)
    return ActionResponse(status="ok", message="Папка создана")


@app.delete("/api/files", response_model=ActionResponse)
def files_delete_endpoint(payload: DeleteFileRequest, current_settings: Settings = Depends(require_token)) -> ActionResponse:
    delete_path(current_settings, payload.path)
    event_store.add_event("warning", "file_deleted", f"Файл удалён: {payload.path}", False)
    return ActionResponse(status="ok", message="Удалено")


@app.get("/api/admin/metrics", response_model=ServerMetricsResponse)
def admin_metrics_endpoint(current_settings: Settings = Depends(require_token)) -> ServerMetricsResponse:
    return collect_server_metrics(current_settings, started_at, started_at_iso)


@app.get("/api/admin/docker", response_model=DockerContainersResponse)
def admin_docker_endpoint(_: Settings = Depends(require_token)) -> DockerContainersResponse:
    return get_docker_containers()


@app.get("/api/admin/services-health", response_model=ServicesHealthResponse)
async def admin_services_health_endpoint(current_settings: Settings = Depends(require_token)) -> ServicesHealthResponse:
    return await check_services_health(current_settings)


@app.get("/api/admin/services-registry")
def admin_services_registry_endpoint(_: Settings = Depends(require_token)):
    services = [service.model_dump() for service in list_admin_services_config()]
    return success_response({"services": services})


@app.get("/api/admin/services-registry/{name}")
def admin_service_registry_endpoint(name: str, _: Settings = Depends(require_token)):
    try:
        return success_response({"service": require_admin_service(name).model_dump()})
    except ApiError as exc:
        return api_error_response(exc)


@app.get("/api/admin/services-registry/{name}/logs")
def admin_service_logs_endpoint(
    name: str,
    tail: int = Query(default=200),
    _: Settings = Depends(require_token),
):
    try:
        logs = get_admin_service_logs(name, tail)
    except ApiError as exc:
        write_audit_event("service.logs.view", service=name, result="failed", details={"code": exc.code})
        return api_error_response(exc)
    write_audit_event("service.logs.view", service=name, result="success", details={"tail": max(10, min(int(tail), 1000))})
    return success_response({"service": name, "tail": max(10, min(int(tail), 1000)), "logs": logs})


@app.post("/api/admin/services-registry/{name}/actions")
def admin_service_action_endpoint(
    name: str,
    payload: ServiceActionRequest,
    _: Settings = Depends(require_token),
) -> ServiceActionResponse | dict:
    try:
        result = run_admin_service_action(name, payload.action, payload.confirm)
    except ApiError as exc:
        task_history.add_task(
            action=f"service.{payload.action}",
            service=name,
            status="failed",
            message=exc.message,
            details={"code": exc.code},
        )
        write_audit_event(f"service.{payload.action}", service=name, result="failed", details={"code": exc.code})
        return api_error_response(exc)

    task = task_history.add_task(
        action=f"service.{payload.action}",
        service=name,
        status="success",
        message=result["message"],
    )
    write_audit_event(f"service.{payload.action}", service=name, result="success")
    return ServiceActionResponse(**result, task_id=task["id"])


@app.get("/api/admin/tasks", response_model=TaskHistoryResponse)
def admin_tasks_endpoint(_: Settings = Depends(require_token)) -> TaskHistoryResponse:
    return TaskHistoryResponse(tasks=task_history.list_tasks())


@app.get("/api/admin/audit", response_model=AuditEventsResponse)
def admin_audit_endpoint(_: Settings = Depends(require_token)) -> AuditEventsResponse:
    return AuditEventsResponse(events=list_audit_events())


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
    try:
        await add_youtube_download(current_settings, payload)
    except Exception:
        event_store.add_event("error", "youtube_error", "Ошибка YouTube-загрузки", False)
        await send_telegram_message(current_settings, "❌ Ошибка YouTube-загрузки")
        return await post_youtube_webhook(payload, current_settings.n8n_yt_webhook)
    event_store.add_event("info", "youtube_added", f"YouTube отправлен на загрузку: {payload.url[:120]}", False)
    await send_telegram_message(current_settings, "🎥 YouTube отправлен на загрузку")
    return WebhookResponse(status="ok", message="Request accepted")


@app.post("/api/magnet", response_model=WebhookResponse)
async def magnet_endpoint(
    payload: MagnetRequest,
    current_settings: Settings = Depends(require_token),
) -> WebhookResponse:
    return await post_magnet_webhook(payload, current_settings.n8n_magnet_webhook)
