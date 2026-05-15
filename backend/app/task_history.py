import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class TaskHistoryStore:
    def __init__(self, path: Path):
        self.path = path

    def add_task(
        self,
        action: str,
        service: str | None,
        status: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        task = {
            "id": str(uuid.uuid4()),
            "action": action,
            "service": service,
            "status": status,
            "message": message,
            "created_at": now,
            "finished_at": now,
            "details": details or {},
        }
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a", encoding="utf-8") as task_file:
            task_file.write(json.dumps(task, ensure_ascii=False) + "\n")
        return task

    def list_tasks(self, limit: int = 100) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        rows: list[dict[str, Any]] = []
        with self.path.open("r", encoding="utf-8") as task_file:
            for line in task_file:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return list(reversed(rows))[: max(1, min(int(limit), 500))]
