import shutil
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile

from .config import Settings
from .models import FileItem, FilesListResponse, YoutubeDownloadItem


def allowed_roots(settings: Settings) -> dict[str, Path]:
    roots = {
        "media": Path(settings.media_path),
        "music": Path(settings.music_path),
        "torrents": Path(settings.torrents_path),
        "youtube": Path(settings.youtube_path),
    }
    books = Path(settings.books_path)
    if books.exists():
        roots["books"] = books
    return roots


def safe_resolve_path(settings: Settings, requested_path: str) -> tuple[str, Path]:
    clean = requested_path.strip().strip("/")
    if not clean:
        raise HTTPException(status_code=400, detail="path is required")
    parts = Path(clean).parts
    if any(part in {"..", ""} for part in parts):
        raise HTTPException(status_code=400, detail="invalid path")
    root_key = parts[0]
    roots = allowed_roots(settings)
    if root_key not in roots:
        raise HTTPException(status_code=403, detail="path root is not allowed")
    root = roots[root_key].resolve()
    resolved = (root.joinpath(*parts[1:])).resolve()
    if resolved != root and root not in resolved.parents:
        raise HTTPException(status_code=403, detail="path escapes allowed root")
    return root_key, resolved


def list_files(settings: Settings, requested_path: str) -> FilesListResponse:
    root_key, resolved = safe_resolve_path(settings, requested_path)
    if not resolved.exists():
        raise HTTPException(status_code=404, detail="path not found")
    if not resolved.is_dir():
        raise HTTPException(status_code=400, detail="path is not a directory")
    items = [_file_item(settings, child, root_key) for child in sorted(resolved.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower()))]
    current_path = _relative_path(settings, resolved, root_key)
    return FilesListResponse(current_path=current_path, parent_path=_parent_path(current_path), items=items, allow_delete=settings.allow_file_delete)


def mkdir(settings: Settings, requested_path: str) -> None:
    _, resolved = safe_resolve_path(settings, requested_path)
    resolved.mkdir(parents=True, exist_ok=True)


async def upload_file(settings: Settings, requested_path: str, upload: UploadFile) -> FileItem:
    _, directory = safe_resolve_path(settings, requested_path)
    if not directory.exists():
        directory.mkdir(parents=True, exist_ok=True)
    if not directory.is_dir():
        raise HTTPException(status_code=400, detail="upload path is not a directory")
    target = directory / Path(upload.filename or "upload.bin").name
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    written = 0
    with target.open("wb") as output:
        while chunk := await upload.read(1024 * 1024):
            written += len(chunk)
            if written > max_bytes:
                target.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="file is too large")
            output.write(chunk)
    root_key = safe_resolve_path(settings, requested_path)[0]
    return _file_item(settings, target, root_key)


def delete_path(settings: Settings, requested_path: str) -> None:
    if not settings.allow_file_delete:
        raise HTTPException(status_code=403, detail="file delete is disabled")
    root_key, resolved = safe_resolve_path(settings, requested_path)
    root = allowed_roots(settings)[root_key].resolve()
    if resolved == root:
        raise HTTPException(status_code=403, detail="cannot delete root folder")
    if not resolved.exists():
        raise HTTPException(status_code=404, detail="path not found")
    if resolved.is_dir():
        shutil.rmtree(resolved)
    else:
        resolved.unlink()


def recent_youtube_downloads(settings: Settings, limit: int = 20) -> list[YoutubeDownloadItem]:
    root = Path(settings.youtube_path)
    if not root.exists():
        return []
    files = [path for path in root.rglob("*") if path.is_file()]
    files.sort(key=lambda path: path.stat().st_mtime, reverse=True)
    return [
        YoutubeDownloadItem(
            name=path.name,
            path=f"youtube/{path.relative_to(root).as_posix()}",
            size=path.stat().st_size,
            modified_at=_mtime(path),
            extension=path.suffix,
        )
        for path in files[:limit]
    ]


def _file_item(settings: Settings, path: Path, root_key: str) -> FileItem:
    stat = path.stat()
    return FileItem(
        name=path.name,
        type="directory" if path.is_dir() else "file",
        path=_relative_path(settings, path, root_key),
        size=None if path.is_dir() else stat.st_size,
        modified_at=_mtime(path),
        extension=None if path.is_dir() else path.suffix,
    )


def _relative_path(settings: Settings, path: Path, root_key: str) -> str:
    root = allowed_roots(settings)[root_key].resolve()
    relative = path.resolve().relative_to(root)
    suffix = relative.as_posix()
    return root_key if suffix == "." else f"{root_key}/{suffix}"


def _parent_path(current_path: str) -> str:
    parts = current_path.split("/")
    if len(parts) <= 1:
        return ""
    return "/".join(parts[:-1])


def _mtime(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat()
