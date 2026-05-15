from app.integrations.jellyfin import map_jellyfin_items, map_jellyfin_libraries
from app.integrations.navidrome import map_navidrome_albums, map_navidrome_artists


def test_maps_jellyfin_libraries_and_posters():
    payload = {
        "Items": [
            {"Id": "movies", "Name": "Movies", "CollectionType": "movies"},
            {"Id": "series", "Name": "Series", "CollectionType": "tvshows"},
        ]
    }

    libraries = map_jellyfin_libraries(payload)

    assert libraries == [
        {"id": "movies", "name": "Movies", "collection_type": "movies"},
        {"id": "series", "name": "Series", "collection_type": "tvshows"},
    ]


def test_maps_jellyfin_items_with_poster_urls():
    payload = {
        "Items": [
            {
                "Id": "abc",
                "Name": "Movie",
                "Type": "Movie",
                "ProductionYear": 1999,
                "DateCreated": "2026-05-01T10:00:00Z",
                "UserData": {"PlaybackPositionTicks": 1000, "PlayedPercentage": 42},
            }
        ]
    }

    items = map_jellyfin_items(payload, "http://media.local", "secret")

    assert items[0]["id"] == "abc"
    assert items[0]["title"] == "Movie"
    assert items[0]["kind"] == "Movie"
    assert items[0]["progress_percent"] == 42
    assert items[0]["poster_url"].startswith("http://media.local/Items/abc/Images/Primary")
    assert "api_key=secret" in items[0]["poster_url"]


def test_maps_navidrome_albums_and_artists():
    albums_payload = {
        "subsonic-response": {
            "albumList2": {
                "album": [
                    {
                        "id": "album-1",
                        "name": "Kid A",
                        "artist": "Radiohead",
                        "year": 2000,
                        "coverArt": "cover-1",
                        "created": "2026-05-02T12:00:00Z",
                    }
                ]
            }
        }
    }
    artists_payload = {
        "subsonic-response": {
            "artists": {
                "index": [
                    {
                        "name": "R",
                        "artist": [
                            {"id": "artist-1", "name": "Radiohead", "albumCount": 9},
                        ],
                    }
                ]
            }
        }
    }

    albums = map_navidrome_albums(albums_payload, "http://music.local", {"u": "u", "t": "t", "s": "s"})
    artists = map_navidrome_artists(artists_payload)

    assert albums[0]["id"] == "album-1"
    assert albums[0]["title"] == "Kid A"
    assert albums[0]["cover_url"].startswith("http://music.local/rest/getCoverArt.view")
    assert artists == [{"id": "artist-1", "name": "Radiohead", "album_count": 9}]
