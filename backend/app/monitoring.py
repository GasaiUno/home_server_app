import asyncio
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import docker
import httpx
import psutil
from docker.errors import DockerException

from .config import Settings
from .models import (
    CpuMetrics,
    DataDiskUsage,
    DiskMetrics,
    DiskUsage,
    DockerContainerItem,
    DockerContainersResponse,
    MemoryMetrics,
    ServerMetricsResponse,
    ServiceHealthItem,
    ServicesHealthResponse,
    SwapMetrics,
    TemperatureMetrics,
    UptimeMetrics,
)

logger = logging.getLogger(__name__)

WATCHED_CONTAINERS = {
    "jellyfin",
    "navidrome",
    "qbittorrent",
    "metube",
    "n8n",
    "homepage",
    "filebrowser",
    "file-browser",
    "homebot",
}


def collect_server_metrics(settings: Settings, backend_started_at: float, backend_started_at_iso: str) -> ServerMetricsResponse:
    return ServerMetricsResponse(
        cpu=_collect_cpu(settings),
        memory=_collect_memory(),
        swap=_collect_swap(),
        disk=_collect_disk(settings),
        uptime=_collect_uptime(settings, backend_started_at, backend_started_at_iso),
        temperature=_collect_temperature(settings),
    )


def _collect_cpu(settings: Settings) -> CpuMetrics:
    try:
        load_avg = [round(value, 2) for value in os.getloadavg()]
    except OSError:
        load_avg = None
    return CpuMetrics(
        percent=round(psutil.cpu_percent(interval=0.1), 1),
        load_avg=load_avg,
        cores_logical=psutil.cpu_count(logical=True),
        cores_physical=psutil.cpu_count(logical=False),
    )


def _collect_memory() -> MemoryMetrics:
    memory = psutil.virtual_memory()
    return MemoryMetrics(total=memory.total, used=memory.used, available=memory.available, percent=round(memory.percent, 1))


def _collect_swap() -> SwapMetrics:
    swap = psutil.swap_memory()
    return SwapMetrics(total=swap.total, used=swap.used, percent=round(swap.percent, 1))


def _disk_usage(path: str) -> DiskUsage:
    try:
        usage = psutil.disk_usage(path)
    except (FileNotFoundError, PermissionError, OSError):
        return DiskUsage(total=None, used=None, free=None, percent=None)
    return DiskUsage(total=usage.total, used=usage.used, free=usage.free, percent=round(usage.percent, 1))


def _collect_disk(settings: Settings) -> DiskMetrics:
    root = _disk_usage(settings.host_root_path)
    data: DataDiskUsage | None = None
    if settings.home_data_path:
        usage = _disk_usage(settings.home_data_path)
        data = DataDiskUsage(path=settings.home_data_path, available=usage.total is not None, **usage.model_dump())
    return DiskMetrics(root=root, data=data)


def _collect_uptime(settings: Settings, backend_started_at: float, backend_started_at_iso: str) -> UptimeMetrics:
    uptime_path = Path(settings.host_proc_path) / "uptime"
    server_uptime_seconds: int | None = None
    try:
        proc_path = uptime_path if uptime_path.exists() else Path("/proc/uptime")
        server_uptime_seconds = int(float(proc_path.read_text(encoding="utf-8").split()[0]))
    except (OSError, ValueError, IndexError):
        server_uptime_seconds = None

    return UptimeMetrics(
        server_uptime_seconds=server_uptime_seconds,
        backend_uptime_seconds=int(time.monotonic() - backend_started_at),
        backend_started_at=backend_started_at_iso,
        server_time=datetime.now(timezone.utc).isoformat(),
    )


def _collect_temperature(settings: Settings) -> TemperatureMetrics:
    sensor_temp = _temperature_from_psutil()
    if sensor_temp is not None:
        return TemperatureMetrics(cpu=sensor_temp, available=True)

    sys_path = Path(settings.host_sys_path)
    for thermal_file in list(sys_path.glob("class/thermal/thermal_zone*/temp")) + list(Path("/sys").glob("class/thermal/thermal_zone*/temp")):
        try:
            value = float(thermal_file.read_text(encoding="utf-8").strip())
        except (OSError, ValueError):
            continue
        if value > 1000:
            value = value / 1000
        return TemperatureMetrics(cpu=round(value, 1), available=True)
    return TemperatureMetrics(cpu=None, available=False)


def _temperature_from_psutil() -> float | None:
    try:
        sensors = psutil.sensors_temperatures(fahrenheit=False)
    except (AttributeError, OSError):
        return None
    for entries in sensors.values():
        for entry in entries:
            if entry.current is not None:
                return round(float(entry.current), 1)
    return None


def get_docker_containers() -> DockerContainersResponse:
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)
    except DockerException as exc:
        logger.info("Docker unavailable: %s", exc)
        return DockerContainersResponse(containers=[])

    result: list[DockerContainerItem] = []
    for container in containers:
        name = container.name
        normalized = name.lower().replace("_", "-")
        if not any(watched in normalized for watched in WATCHED_CONTAINERS):
            continue
        attrs = container.attrs
        state = attrs.get("State", {})
        health = state.get("Health", {}).get("Status")
        result.append(
            DockerContainerItem(
                name=name,
                status=state.get("Status") or container.status,
                image=attrs.get("Config", {}).get("Image"),
                created=attrs.get("Created"),
                started_at=state.get("StartedAt"),
                restart_count=attrs.get("RestartCount"),
                health=health,
            )
        )
    return DockerContainersResponse(containers=result)


async def check_services_health(settings: Settings) -> ServicesHealthResponse:
    async def check(service) -> ServiceHealthItem:
        started = time.perf_counter()
        status_code: int | None = None
        online = False
        try:
            async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client:
                response = await client.get(service.url)
                status_code = response.status_code
                online = response.status_code < 500
        except httpx.HTTPError:
            online = False
        elapsed = int((time.perf_counter() - started) * 1000)
        return ServiceHealthItem(
            id=service.id,
            name=service.name,
            url=service.url,
            online=online,
            status_code=status_code,
            response_time_ms=elapsed,
        )

    services = await asyncio.gather(*(check(service) for service in settings.services))
    return ServicesHealthResponse(services=list(services))
