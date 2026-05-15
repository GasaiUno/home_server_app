from hashlib import md5
from urllib.parse import urlencode

import httpx

from ..api_response import ApiError
from ..config import Settings


def _base_url(url: str) -> str:
    return url.rstrip("/")


def _auth_params(settings: Settings) -> dict[str, str]:
    if not settings.navidrome_username or not settings.navidrome_password:
        raise ApiError(
            "NAVIDROME_NOT_CONFIGURED",
            "Navidrome credentials are not configured",
            status_code=503,
        )
    token = md5(f"{settings.navidrome_password}{settings.navidrome_salt}".encode("utf-8")).hexdigest()
    return {
        "u": settings.navidrome_username,
        "t": token,
        "s": settings.navidrome_salt,
        "v": "1.16.1",
        "c": "home-server-app",
        "f": "json",
    }


def _cover_url(public_base_url: str | None, cover_id: str | None, auth: dict[str, str]) -> str | None:
    if not public_base_url or not cover_id:
        return None
    query = urlencode({"id": cover_id, **auth})
    return f"{_base_url(public_base_url)}/rest/getCoverArt.view?{query}"


def _subsonic(payload: dict) -> dict:
    return payload.get("subsonic-response") or {}


def map_navidrome_albums(payload: dict, public_base_url: str | None, auth: dict[str, str]) -> list[dict]:
    albums = (_subsonic(payload).get("albumList2") or {}).get("album") or []
    mapped = []
    for album in albums:
        album_id = str(album.get("id") or "")
        if not album_id:
            continue
        mapped.append(
            {
                "id": album_id,
                "title": str(album.get("name") or "Без названия"),
                "artist": album.get("artist"),
                "year": album.get("year"),
                "created": album.get("created"),
                "cover_url": _cover_url(public_base_url, album.get("coverArt"), auth),
            }
        )
    return mapped


def map_navidrome_artists(payload: dict) -> list[dict]:
    indexes = ((_subsonic(payload).get("artists") or {}).get("index")) or []
    artists = []
    for index in indexes:
        for artist in index.get("artist") or []:
            artist_id = str(artist.get("id") or "")
            if artist_id:
                artists.append(
                    {
                        "id": artist_id,
                        "name": str(artist.get("name") or "Без названия"),
                        "album_count": artist.get("albumCount"),
                    }
                )
    return artists


def map_navidrome_search(payload: dict, public_base_url: str | None, auth: dict[str, str]) -> dict:
    result = _subsonic(payload).get("searchResult3") or {}
    albums_payload = {"subsonic-response": {"albumList2": {"album": result.get("album") or []}}}
    artists = [
        {
            "id": str(artist.get("id") or ""),
            "name": str(artist.get("name") or "Без названия"),
            "album_count": artist.get("albumCount"),
        }
        for artist in result.get("artist") or []
        if artist.get("id")
    ]
    return {"albums": map_navidrome_albums(albums_payload, public_base_url, auth), "artists": artists}


async def _get(settings: Settings, path: str, params: dict[str, str | int]) -> dict:
    async with httpx.AsyncClient(base_url=_base_url(settings.navidrome_url), timeout=12.0) as client:
        try:
            response = await client.get(path, params={**_auth_params(settings), **params})
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ApiError("NAVIDROME_HTTP_ERROR", "Navidrome returned an error", {"status": exc.response.status_code}, 502) from exc
        except httpx.HTTPError as exc:
            raise ApiError("NAVIDROME_UNAVAILABLE", "Navidrome is unavailable", status_code=502) from exc
    return response.json()


async def get_navidrome_recent(settings: Settings, public_base_url: str | None, limit: int = 24) -> dict:
    auth = _auth_params(settings)
    payload = await _get(settings, "/rest/getAlbumList2.view", {"type": "newest", "size": max(1, min(limit, 50))})
    return {"albums": map_navidrome_albums(payload, public_base_url, auth)}


async def get_navidrome_albums(settings: Settings, public_base_url: str | None, limit: int = 50) -> dict:
    auth = _auth_params(settings)
    payload = await _get(settings, "/rest/getAlbumList2.view", {"type": "alphabeticalByName", "size": max(1, min(limit, 100))})
    return {"albums": map_navidrome_albums(payload, public_base_url, auth)}


async def get_navidrome_artists(settings: Settings) -> dict:
    payload = await _get(settings, "/rest/getArtists.view", {})
    return {"artists": map_navidrome_artists(payload)}


async def search_navidrome(settings: Settings, public_base_url: str | None, query: str) -> dict:
    auth = _auth_params(settings)
    payload = await _get(
        settings,
        "/rest/search3.view",
        {"query": query, "artistCount": 12, "albumCount": 12, "songCount": 0},
    )
    return map_navidrome_search(payload, public_base_url, auth)
