from pathlib import Path

import pytest

from app.admin_services import ensure_service_action_allowed
from app.api_response import ApiError
from app.audit import list_audit_events, write_audit_event
from app.docker_admin import run_admin_service_action
from app.task_history import TaskHistoryStore


def test_task_history_appends_and_lists_latest_first(tmp_path: Path):
    store = TaskHistoryStore(tmp_path / "tasks.jsonl")

    first = store.add_task(action="service.restart", service="jellyfin", status="success", message="ok")
    second = store.add_task(action="service.stop", service="navidrome", status="failed", message="blocked")

    tasks = store.list_tasks()

    assert [task["id"] for task in tasks] == [second["id"], first["id"]]
    assert tasks[0]["service"] == "navidrome"
    assert tasks[0]["status"] == "failed"


class FakeContainer:
    status = "running"
    attrs = {"State": {"Status": "running", "Health": {"Status": "healthy"}}}

    def __init__(self):
        self.calls = []

    def restart(self, timeout=10):
        self.calls.append(("restart", timeout))

    def start(self):
        self.calls.append(("start", None))

    def stop(self, timeout=10):
        self.calls.append(("stop", timeout))


def test_service_action_requires_confirmation():
    with pytest.raises(ApiError) as exc_info:
        run_admin_service_action("jellyfin", "restart", confirm=False)

    assert exc_info.value.code == "SERVICE_ACTION_CONFIRM_REQUIRED"


def test_restart_calls_container_restart(monkeypatch):
    fake = FakeContainer()
    monkeypatch.setattr("app.docker_admin._get_container_for_service", lambda name: (ensure_service_action_allowed(name, "restart"), fake))

    result = run_admin_service_action("jellyfin", "restart", confirm=True)

    assert fake.calls == [("restart", 10)]
    assert result["status"] == "ok"


def test_audit_events_are_listed_latest_first(tmp_path: Path, monkeypatch):
    audit_path = tmp_path / "audit.jsonl"
    monkeypatch.setattr("app.audit.AUDIT_LOG_PATH", audit_path)

    write_audit_event("service.restart", service="jellyfin", result="success")
    write_audit_event("service.stop", service="navidrome", result="failed", details={"code": "X"})

    events = list_audit_events()

    assert events[0]["action"] == "service.stop"
    assert events[0]["details"] == {"code": "X"}
