from pathlib import Path

import httpx
from fastapi import HTTPException

from ..config import Settings
from ..models import TorrentItem


class QBittorrentClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = settings.qb_url.rstrip("/")

    async def _client(self) -> httpx.AsyncClient:
        client = httpx.AsyncClient(base_url=self.base_url, timeout=15.0)
        if not self.settings.qb_bypass_auth:
            if not self.settings.qb_username or not self.settings.qb_password:
                await client.aclose()
                raise HTTPException(status_code=500, detail="qBittorrent credentials are not configured")
            response = await client.post(
                "/api/v2/auth/login",
                data={"username": self.settings.qb_username, "password": self.settings.qb_password},
            )
            if response.status_code != 200 or response.text.lower() != "ok.":
                await client.aclose()
                raise HTTPException(status_code=502, detail="qBittorrent login failed")
        return client

    async def get_torrents(self) -> list[TorrentItem]:
        try:
            async with await self._client() as client:
                response = await client.get("/api/v2/torrents/info")
                response.raise_for_status()
                return [_map_torrent(item) for item in response.json()]
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="qBittorrent is unavailable") from exc

    async def add_magnet(self, url: str, category: str | None) -> None:
        data = {"urls": url}
        if category:
            data["category"] = category
        try:
            async with await self._client() as client:
                response = await client.post("/api/v2/torrents/add", data=data)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="qBittorrent add magnet failed") from exc

    async def add_torrent_file(self, file_path: Path, category: str | None) -> None:
        data = {}
        if category:
            data["category"] = category
        try:
            async with await self._client() as client:
                with file_path.open("rb") as torrent_file:
                    response = await client.post(
                        "/api/v2/torrents/add",
                        data=data,
                        files={"torrents": (file_path.name, torrent_file, "application/x-bittorrent")},
                    )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="qBittorrent add torrent file failed") from exc

    async def pause_torrent(self, torrent_hash: str) -> None:
        await self._command("/api/v2/torrents/pause", torrent_hash)

    async def resume_torrent(self, torrent_hash: str) -> None:
        await self._command("/api/v2/torrents/resume", torrent_hash)

    async def delete_torrent(self, torrent_hash: str, delete_files: bool) -> None:
        try:
            async with await self._client() as client:
                response = await client.post(
                    "/api/v2/torrents/delete",
                    data={"hashes": torrent_hash, "deleteFiles": "true" if delete_files else "false"},
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="qBittorrent delete failed") from exc

    async def _command(self, path: str, torrent_hash: str) -> None:
        try:
            async with await self._client() as client:
                response = await client.post(path, data={"hashes": torrent_hash})
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="qBittorrent command failed") from exc


def _map_torrent(item: dict) -> TorrentItem:
    return TorrentItem(
        hash=str(item.get("hash", "")),
        name=str(item.get("name", "")),
        state=str(item.get("state", "unknown")),
        progress=float(item.get("progress", 0)),
        size=int(item.get("size", 0)),
        downloaded=int(item.get("downloaded", 0)),
        uploaded=int(item.get("uploaded", 0)),
        dlspeed=int(item.get("dlspeed", 0)),
        upspeed=int(item.get("upspeed", 0)),
        eta=int(item.get("eta", 0)),
        category=item.get("category"),
        save_path=item.get("save_path"),
    )
