import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

AUDIT_LOG_PATH = Path("app_data/audit.jsonl")


def _json_safe(value: dict | None) -> dict:
    if not value:
        return {}
    try:
        json.dumps(value)
    except (TypeError, ValueError):
        return {"serialization_error": True}
    return value


def write_audit_event(
    action: str,
    service: str | None = None,
    result: str = "success",
    details: dict[str, Any] | None = None,
) -> None:
    event = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "service": service,
        "result": result,
        "details": _json_safe(details),
    }
    try:
        AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with AUDIT_LOG_PATH.open("a", encoding="utf-8") as audit_file:
            audit_file.write(json.dumps(event, ensure_ascii=False) + "\n")
    except OSError as exc:
        logger.info("Audit log unavailable: %s", exc)


def list_audit_events(limit: int = 100) -> list[dict[str, Any]]:
    if not AUDIT_LOG_PATH.exists():
        return []
    rows: list[dict[str, Any]] = []
    with AUDIT_LOG_PATH.open("r", encoding="utf-8") as audit_file:
        for line in audit_file:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return list(reversed(rows))[: max(1, min(int(limit), 500))]
