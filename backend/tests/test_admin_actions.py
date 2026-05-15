from pathlib import Path

from app.task_history import TaskHistoryStore


def test_task_history_appends_and_lists_latest_first(tmp_path: Path):
    store = TaskHistoryStore(tmp_path / "tasks.jsonl")

    first = store.add_task(action="service.restart", service="jellyfin", status="success", message="ok")
    second = store.add_task(action="service.stop", service="navidrome", status="failed", message="blocked")

    tasks = store.list_tasks()

    assert [task["id"] for task in tasks] == [second["id"], first["id"]]
    assert tasks[0]["service"] == "navidrome"
    assert tasks[0]["status"] == "failed"
