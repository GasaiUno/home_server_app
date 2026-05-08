from pathlib import Path

import pytest
from fastapi import HTTPException

from app.config import get_settings
from app.file_service import list_files, safe_resolve_path


@pytest.fixture()
def file_settings(monkeypatch, tmp_path):
    media = tmp_path / "media"
    music = tmp_path / "music"
    torrents = tmp_path / "torrents"
    youtube = tmp_path / "youtube"
    for path in (media, music, torrents, youtube):
        path.mkdir()
    (media / "movie.mkv").write_text("data", encoding="utf-8")
    monkeypatch.setenv("MEDIA_PATH", str(media))
    monkeypatch.setenv("MUSIC_PATH", str(music))
    monkeypatch.setenv("TORRENTS_PATH", str(torrents))
    monkeypatch.setenv("YOUTUBE_PATH", str(youtube))
    monkeypatch.setenv("BOOKS_PATH", str(tmp_path / "books"))
    get_settings.cache_clear()
    yield get_settings()
    get_settings.cache_clear()


def test_safe_resolve_allows_configured_roots(file_settings):
    _, resolved = safe_resolve_path(file_settings, "media/movie.mkv")

    assert resolved == Path(file_settings.media_path) / "movie.mkv"


def test_safe_resolve_rejects_path_traversal(file_settings):
    with pytest.raises(HTTPException):
        safe_resolve_path(file_settings, "media/../../etc/passwd")


def test_list_files_returns_relative_paths(file_settings):
    payload = list_files(file_settings, "media")

    assert payload.current_path == "media"
    assert payload.items[0].path == "media/movie.mkv"
