import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from .models import EventItem


class EventStore:
    def __init__(self, path: Path, limit: int = 200) -> None:
        self.path = path
        self.limit = limit
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def list_events(self) -> list[EventItem]:
        if not self.path.exists():
            return []
        try:
            raw_events = json.loads(self.path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []
        return [EventItem(**event) for event in raw_events[: self.limit]]

    def add_event(self, level: str, event_type: str, message: str, sent_to_telegram: bool) -> EventItem:
        event = EventItem(
            id=str(uuid4()),
            level=level,
            type=event_type,
            message=message,
            created_at=datetime.now(timezone.utc).isoformat(),
            sent_to_telegram=sent_to_telegram,
        )
        events = [event, *self.list_events()][: self.limit]
        self.path.write_text(
            json.dumps([item.model_dump() for item in events], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return event
