from urllib.parse import urlencode

import httpx

from ..api_response import ApiError
from ..config import Settings


def _base_url(url: str) -> str:
    return url.rstrip("/")


def _headers(settings: Settings) -> dict[str, str]:
    if not settings.jellyfin_api_key:
        raise ApiError(
            "JELLYFIN_NOT_CONFIGURED",
            "Jellyfin API key is not configured",
            status_code=503,
        )
    return {"X-Emby-Token": settings.jellyfin_api_key}


def _image_url(public_base_url: str | None, item_id: str, api_key: str | None) -> str | None:
    if not public_base_url or not item_id or not api_key:
        return None
    query = urlencode({"fillWidth": 342, "fillHeight": 513, "quality": 90, "api_key": api_key})
    return f"{_base_url(public_base_url)}/Items/{item_id}/Images/Primary?{query}"


def build_jellyfin_items_request(
    settings: Settings,
    item_type: str | None = None,
    search: str | None = None,
    parent_id: str | None = None,
    mode: str | None = None,
    limit: int = 24,
) -> tuple[str, dict[str, str | int]]:
    if mode == "resume":
        if not settings.jellyfin_user_id:
            return "", {}
        params: dict[str, str | int] = {
            "Limit": max(1, min(limit, 50)),
            "Fields": "PrimaryImageAspectRatio,DateCreated,Overview",
            "ImageTypeLimit": 1,
            "EnableImageTypes": "Primary",
        }
        if item_type:
            params["IncludeItemTypes"] = item_type
        if parent_id:
            params["ParentId"] = parent_id
        return f"/Users/{settings.jellyfin_user_id}/Items/Resume", params

    path = f"/Users/{settings.jellyfin_user_id}/Items" if settings.jellyfin_user_id else "/Items"
    params = {
        "Recursive": "true",
        "SortBy": "DateCreated",
        "SortOrder": "Descending",
        "Limit": max(1, min(limit, 50)),
        "Fields": "PrimaryImageAspectRatio,DateCreated,Overview",
        "ImageTypeLimit": 1,
        "EnableImageTypes": "Primary",
    }
    if item_type:
        params["IncludeItemTypes"] = item_type
    if search:
        params["SearchTerm"] = search
    if parent_id:
        params["ParentId"] = parent_id
    return path, params


def map_jellyfin_libraries(payload: dict) -> list[dict]:
    return [
        {
            "id": str(item.get("Id") or ""),
            "name": str(item.get("Name") or "Без названия"),
            "collection_type": item.get("CollectionType"),
        }
        for item in payload.get("Items", [])
        if item.get("Id")
    ]


def map_jellyfin_items(payload: dict, public_base_url: str | None, api_key: str | None) -> list[dict]:
    mapped = []
    for item in payload.get("Items", []):
        item_id = str(item.get("Id") or "")
        if not item_id:
            continue
        user_data = item.get("UserData") or {}
        mapped.append(
            {
                "id": item_id,
                "title": str(item.get("Name") or "Без названия"),
                "kind": str(item.get("Type") or "Unknown"),
                "year": item.get("ProductionYear"),
                "overview": item.get("Overview"),
                "date_created": item.get("DateCreated"),
                "runtime_ticks": item.get("RunTimeTicks"),
                "progress_percent": user_data.get("PlayedPercentage"),
                "poster_url": _image_url(public_base_url, item_id, api_key),
            }
        )
    return mapped


async def get_jellyfin_libraries(settings: Settings) -> dict:
    async with httpx.AsyncClient(base_url=_base_url(settings.jellyfin_url), timeout=12.0) as client:
        try:
            response = await client.get("/Library/MediaFolders", headers=_headers(settings))
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ApiError("JELLYFIN_HTTP_ERROR", "Jellyfin returned an error", {"status": exc.response.status_code}, 502) from exc
        except httpx.HTTPError as exc:
            raise ApiError("JELLYFIN_UNAVAILABLE", "Jellyfin is unavailable", status_code=502) from exc
    return {"libraries": map_jellyfin_libraries(response.json())}


async def get_jellyfin_items(
    settings: Settings,
    public_base_url: str | None,
    item_type: str | None = None,
    search: str | None = None,
    parent_id: str | None = None,
    mode: str | None = None,
    limit: int = 24,
) -> dict:
    path, params = build_jellyfin_items_request(settings, item_type, search, parent_id, mode, limit)
    if not path:
        return {"items": []}

    async with httpx.AsyncClient(base_url=_base_url(settings.jellyfin_url), timeout=12.0) as client:
        try:
            response = await client.get(path, params=params, headers=_headers(settings))
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ApiError(
                "JELLYFIN_HTTP_ERROR",
                "Jellyfin returned an error",
                {"status": exc.response.status_code, "path": path, "params": params, "body": exc.response.text[:500]},
                502,
            ) from exc
        except httpx.HTTPError as exc:
            raise ApiError("JELLYFIN_UNAVAILABLE", "Jellyfin is unavailable", status_code=502) from exc
    return {"items": map_jellyfin_items(response.json(), public_base_url, settings.jellyfin_api_key)}
