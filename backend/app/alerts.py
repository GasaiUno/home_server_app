import asyncio
import logging
import time
from contextlib import suppress

from .config import Settings
from .events import EventStore
from .monitoring import check_services_health, collect_server_metrics, get_docker_containers
from .telegram import send_telegram_message

logger = logging.getLogger(__name__)


class AlertMonitor:
    def __init__(self, settings: Settings, event_store: EventStore, backend_started_at: float, backend_started_at_iso: str) -> None:
        self.settings = settings
        self.event_store = event_store
        self.backend_started_at = backend_started_at
        self.backend_started_at_iso = backend_started_at_iso
        self.cooldowns: dict[str, float] = {}
        self._task: asyncio.Task | None = None
        self._stopping = asyncio.Event()

    def start(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        self._stopping.set()
        if self._task:
            self._task.cancel()
            with suppress(asyncio.CancelledError):
                await self._task

    async def send_startup_message(self) -> None:
        if not self.settings.alerts_enabled:
            return
        sent = await send_telegram_message(self.settings, "✅ Home Server App backend запущен")
        self.event_store.add_event("info", "backend_started", "Home Server App backend запущен", sent)

    async def send_test_alert(self) -> bool:
        sent = await send_telegram_message(self.settings, "✅ Тестовое уведомление Home Server App")
        self.event_store.add_event("info", "telegram_test", "Тестовое уведомление Telegram", sent)
        return sent

    async def _run(self) -> None:
        await self.send_startup_message()
        while not self._stopping.is_set():
            try:
                await self.check_once()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Alert check failed: %s", exc)
            try:
                await asyncio.wait_for(self._stopping.wait(), timeout=self.settings.alert_check_interval_seconds)
            except asyncio.TimeoutError:
                continue

    async def check_once(self) -> None:
        if not self.settings.alerts_enabled:
            return

        metrics = collect_server_metrics(self.settings, self.backend_started_at, self.backend_started_at_iso)
        await self._threshold_alert("cpu_high", metrics.cpu.percent, self.settings.alert_cpu_percent, "warning", "⚠️ Высокая загрузка CPU: {value:.0f}%")
        await self._threshold_alert(
            "memory_high",
            metrics.memory.percent,
            self.settings.alert_memory_percent,
            "warning",
            "⚠️ Высокое использование RAM: {value:.0f}%",
        )
        await self._threshold_alert("swap_high", metrics.swap.percent, self.settings.alert_swap_percent, "warning", "⚠️ Активно используется swap: {value:.0f}%")
        await self._threshold_alert(
            "disk_high",
            metrics.disk.root.percent,
            self.settings.alert_disk_percent,
            "critical",
            "🚨 Мало места на диске: занято {value:.0f}%",
        )
        await self._threshold_alert(
            "temperature_high",
            metrics.temperature.cpu,
            self.settings.alert_temperature_c,
            "critical",
            "🔥 Высокая температура CPU: {value:.0f}°C",
        )

        for container in get_docker_containers().containers:
            if container.status not in {"running"} or container.health == "unhealthy":
                await self._emit_once(
                    f"container_down:{container.name}",
                    "critical",
                    "container_down",
                    f"🚨 Контейнер {container.name} не запущен",
                )

        health = await check_services_health(self.settings)
        for service in health.services:
            if not service.online:
                await self._emit_once(
                    f"service_down:{service.id}",
                    "critical",
                    "service_down",
                    f"🚨 Сервис {service.name} недоступен",
                )

    async def _threshold_alert(self, key: str, value: float | None, threshold: float, level: str, template: str) -> None:
        if value is None or value < threshold:
            return
        await self._emit_once(key, level, key, template.format(value=value))

    async def _emit_once(self, key: str, level: str, event_type: str, message: str) -> None:
        now = time.monotonic()
        if now - self.cooldowns.get(key, 0) < self.settings.alert_cooldown_seconds:
            return
        self.cooldowns[key] = now
        sent = await send_telegram_message(self.settings, message)
        self.event_store.add_event(level, event_type, message, sent)
