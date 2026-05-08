from pydantic import BaseModel, Field, field_validator


class ServiceItem(BaseModel):
    id: str
    name: str
    url: str
    description: str
    icon: str
    accent: str
    category: str
    health_url: str | None = None


class ServicesResponse(BaseModel):
    services: list[ServiceItem]


class StatusResponse(BaseModel):
    status: str
    app: str
    version: str
    uptime_seconds: int
    server_time: str


class YoutubeRequest(BaseModel):
    url: str = Field(min_length=1)
    quality: str = "best"
    download_type: str = "video"
    format: str = "any"

    @field_validator("url")
    @classmethod
    def validate_http_url(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped.startswith(("http://", "https://")):
            raise ValueError("url must be an http or https link")
        return stripped


class MagnetRequest(BaseModel):
    url: str = Field(min_length=1)

    @field_validator("url")
    @classmethod
    def validate_magnet_url(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped.startswith("magnet:"):
            raise ValueError("url must start with magnet:")
        return stripped


class WebhookResponse(BaseModel):
    status: str
    message: str


class CpuMetrics(BaseModel):
    percent: float | None
    load_avg: list[float] | None
    cores_logical: int | None
    cores_physical: int | None


class MemoryMetrics(BaseModel):
    total: int | None
    used: int | None
    available: int | None
    percent: float | None


class SwapMetrics(BaseModel):
    total: int | None
    used: int | None
    percent: float | None


class DiskUsage(BaseModel):
    total: int | None
    used: int | None
    free: int | None
    percent: float | None


class DataDiskUsage(DiskUsage):
    path: str
    available: bool = True


class DiskMetrics(BaseModel):
    root: DiskUsage
    data: DataDiskUsage | None = None


class UptimeMetrics(BaseModel):
    server_uptime_seconds: int | None
    backend_uptime_seconds: int
    backend_started_at: str
    server_time: str


class TemperatureMetrics(BaseModel):
    cpu: float | None
    available: bool


class ServerMetricsResponse(BaseModel):
    cpu: CpuMetrics
    memory: MemoryMetrics
    swap: SwapMetrics
    disk: DiskMetrics
    uptime: UptimeMetrics
    temperature: TemperatureMetrics


class DockerContainerItem(BaseModel):
    name: str
    status: str
    image: str | None = None
    created: str | None = None
    started_at: str | None = None
    restart_count: int | None = None
    health: str | None = None


class DockerContainersResponse(BaseModel):
    containers: list[DockerContainerItem]


class ServiceHealthItem(BaseModel):
    id: str
    name: str
    url: str
    checked_url: str
    online: bool
    status_code: int | None
    response_time_ms: int | None


class ServicesHealthResponse(BaseModel):
    services: list[ServiceHealthItem]


class EventItem(BaseModel):
    id: str
    level: str
    type: str
    message: str
    created_at: str
    sent_to_telegram: bool


class TelegramStatus(BaseModel):
    enabled: bool
    configured: bool


class EventsResponse(BaseModel):
    events: list[EventItem]
    telegram: TelegramStatus


class AlertTestResponse(BaseModel):
    status: str
    message: str
    telegram: TelegramStatus
