import { ExternalLink, Film, Music, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  getJellyfinItems,
  getJellyfinLibraries,
  getJellyfinRecent,
  getMusicAlbums,
  getMusicArtists,
  getMusicRecent,
  searchJellyfin,
  searchMusic
} from "../api";
import type { JellyfinLibraryItem, JellyfinMediaItem, MusicAlbumItem, MusicArtistItem, ServiceItem, ServiceTarget } from "../types";
import { findServiceUrl, getApiErrorCode, getErrorMessage } from "../utils";

type MediaPageProps = {
  token: string;
  services: ServiceItem[];
  serviceTarget: ServiceTarget;
  onNotice: (notice: { type: "success" | "error"; message: string } | null) => void;
};

export function MediaPage({ token, services, serviceTarget, onNotice }: MediaPageProps) {
  const [libraries, setLibraries] = useState<JellyfinLibraryItem[]>([]);
  const [movies, setMovies] = useState<JellyfinMediaItem[]>([]);
  const [series, setSeries] = useState<JellyfinMediaItem[]>([]);
  const [resume, setResume] = useState<JellyfinMediaItem[]>([]);
  const [recentAlbums, setRecentAlbums] = useState<MusicAlbumItem[]>([]);
  const [artists, setArtists] = useState<MusicArtistItem[]>([]);
  const [albums, setAlbums] = useState<MusicAlbumItem[]>([]);
  const [query, setQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"jellyfin" | "navidrome">("jellyfin");
  const [jellyfinResults, setJellyfinResults] = useState<JellyfinMediaItem[]>([]);
  const [musicResults, setMusicResults] = useState<{ albums: MusicAlbumItem[]; artists: MusicArtistItem[] }>({ albums: [], artists: [] });
  const [jellyfinConfigNotice, setJellyfinConfigNotice] = useState("");
  const [navidromeConfigNotice, setNavidromeConfigNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setJellyfinConfigNotice("");
    setNavidromeConfigNotice("");
    void Promise.allSettled([
      getJellyfinLibraries(token),
      getJellyfinRecent(token, "Movie"),
      getJellyfinRecent(token, "Series"),
      getJellyfinItems(token, { mode: "resume", limit: 12 }),
      getMusicRecent(token),
      getMusicArtists(token),
      getMusicAlbums(token)
    ])
      .then((results) => {
        if (results[0].status === "fulfilled") setLibraries(results[0].value.libraries);
        if (results[1].status === "fulfilled") setMovies(results[1].value.items);
        if (results[2].status === "fulfilled") setSeries(results[2].value.items);
        if (results[3].status === "fulfilled") setResume(results[3].value.items);
        if (results[4].status === "fulfilled") setRecentAlbums(results[4].value.albums);
        if (results[5].status === "fulfilled") setArtists(results[5].value.artists.slice(0, 24));
        if (results[6].status === "fulfilled") setAlbums(results[6].value.albums);

        const jellyfinRejected = results.slice(0, 4).find((result) => result.status === "rejected");
        const navidromeRejected = results.slice(4).find((result) => result.status === "rejected");

        if (jellyfinRejected?.status === "rejected") {
          const code = getApiErrorCode(jellyfinRejected.reason);
          if (code === "JELLYFIN_NOT_CONFIGURED") {
            setJellyfinConfigNotice("Для обзора Jellyfin задайте JELLYFIN_API_KEY. До настройки раздел останется пустым, но страница продолжит работать.");
          } else {
            onNotice({ type: "error", message: `Jellyfin API недоступен: ${getErrorMessage(jellyfinRejected.reason)}` });
          }
        }

        if (navidromeRejected?.status === "rejected") {
          const code = getApiErrorCode(navidromeRejected.reason);
          if (code === "NAVIDROME_NOT_CONFIGURED") {
            setNavidromeConfigNotice(
              "Для обзора Navidrome задайте NAVIDROME_USERNAME и NAVIDROME_PASSWORD. До настройки музыкальные блоки останутся пустыми."
            );
          } else {
            onNotice({ type: "error", message: `Navidrome API недоступен: ${getErrorMessage(navidromeRejected.reason)}` });
          }
        }
      })
      .finally(() => setLoading(false));
  }, [onNotice, token]);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    try {
      if (searchScope === "jellyfin") {
        const payload = await searchJellyfin(token, value);
        setJellyfinResults(payload.items);
      } else {
        const payload = await searchMusic(token, value);
        setMusicResults(payload);
      }
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === "JELLYFIN_NOT_CONFIGURED") {
        setJellyfinConfigNotice("Для поиска Jellyfin задайте JELLYFIN_API_KEY.");
        return;
      }
      if (code === "NAVIDROME_NOT_CONFIGURED") {
        setNavidromeConfigNotice("Для поиска Navidrome задайте NAVIDROME_USERNAME и NAVIDROME_PASSWORD.");
        return;
      }
      onNotice({ type: "error", message: `Поиск не выполнен: ${getErrorMessage(error)}` });
    }
  }

  const jellyfinUrl = findServiceUrl(services, "jellyfin");
  const navidromeUrl = findServiceUrl(services, "navidrome");

  return (
    <div className="media-catalog-page">
      <section className="media-catalog-hero">
        <div>
          <span className="section-kicker">Медиа</span>
          <h1>Jellyfin и Navidrome</h1>
          <p>Обзор библиотек, последних добавлений, продолжения просмотра и музыкальной коллекции без встроенного плеера.</p>
        </div>
        <div className="media-catalog-actions">
          <ExternalButton href={jellyfinUrl} target={serviceTarget} label="Открыть в Jellyfin" />
          <ExternalButton href={navidromeUrl} target={serviceTarget} label="Открыть в Navidrome" />
        </div>
      </section>

      <form className="media-search-panel" onSubmit={submitSearch}>
        <div className="media-search-tabs" role="tablist" aria-label="Область поиска">
          <button type="button" className={searchScope === "jellyfin" ? "active" : ""} onClick={() => setSearchScope("jellyfin")}>
            <Film size={16} aria-hidden="true" />
            Jellyfin
          </button>
          <button type="button" className={searchScope === "navidrome" ? "active" : ""} onClick={() => setSearchScope("navidrome")}>
            <Music size={16} aria-hidden="true" />
            Navidrome
          </button>
        </div>
        <div className="media-search-row">
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по медиатеке" />
          <button type="submit">Найти</button>
        </div>
      </form>

      {searchScope === "jellyfin" && jellyfinResults.length > 0 ? <PosterRail title="Результаты Jellyfin" items={jellyfinResults} /> : null}
      {searchScope === "navidrome" && (musicResults.albums.length > 0 || musicResults.artists.length > 0) ? (
        <MusicSearchResults albums={musicResults.albums} artists={musicResults.artists} />
      ) : null}

      <section className="media-section">
        <div className="section-heading">
          <h2>Jellyfin overview</h2>
          <span>{loading ? "загрузка" : `${libraries.length} библиотек`}</span>
        </div>
        <div className="library-grid">
          {libraries.map((library) => (
            <div className="library-pill" key={library.id}>
              <strong>{library.name}</strong>
              <small>{library.collection_type ?? "library"}</small>
            </div>
          ))}
          {!libraries.length ? <EmptyState text="Библиотеки пока не получены" /> : null}
        </div>
        {jellyfinConfigNotice ? <p className="media-config-note">{jellyfinConfigNotice}</p> : null}
        <PosterRail title="Продолжить просмотр" items={resume} compact />
        <PosterRail title="Недавно добавленные фильмы" items={movies} />
        <PosterRail title="Недавно добавленные сериалы" items={series} />
      </section>

      <section className="media-section">
        <div className="section-heading">
          <h2>Navidrome overview</h2>
          <span>{loading ? "загрузка" : `${albums.length} альбомов`}</span>
        </div>
        {navidromeConfigNotice ? <p className="media-config-note">{navidromeConfigNotice}</p> : null}
        <AlbumRail title="Недавно добавленные альбомы" albums={recentAlbums} />
        <ArtistGrid artists={artists} />
        <AlbumRail title="Альбомы" albums={albums} />
      </section>
    </div>
  );
}

function ExternalButton({ href, target, label }: { href: string; target: ServiceTarget; label: string }) {
  return (
    <a className="media-external-button" href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined}>
      <ExternalLink size={17} aria-hidden="true" />
      {label}
    </a>
  );
}

function PosterRail({ title, items, compact = false }: { title: string; items: JellyfinMediaItem[]; compact?: boolean }) {
  return (
    <div className="media-rail">
      <h3>{title}</h3>
      <div className={compact ? "poster-row compact" : "poster-row"}>
        {items.map((item) => (
          <article className="poster-card" key={item.id}>
            {item.poster_url ? <img src={item.poster_url} alt="" loading="lazy" /> : <div className="poster-fallback">{item.kind}</div>}
            <strong>{item.title}</strong>
            <small>{[item.kind, item.year].filter(Boolean).join(" · ")}</small>
            {item.progress_percent ? <span>{Math.round(item.progress_percent)}%</span> : null}
          </article>
        ))}
        {!items.length ? <EmptyState text="Нет данных для блока" /> : null}
      </div>
    </div>
  );
}

function AlbumRail({ title, albums }: { title: string; albums: MusicAlbumItem[] }) {
  return (
    <div className="media-rail">
      <h3>{title}</h3>
      <div className="album-row">
        {albums.map((album) => (
          <article className="album-card" key={album.id}>
            {album.cover_url ? <img src={album.cover_url} alt="" loading="lazy" /> : <div className="album-fallback"><Music size={24} /></div>}
            <strong>{album.title}</strong>
            <small>{[album.artist, album.year].filter(Boolean).join(" · ")}</small>
          </article>
        ))}
        {!albums.length ? <EmptyState text="Альбомы пока не получены" /> : null}
      </div>
    </div>
  );
}

function ArtistGrid({ artists }: { artists: MusicArtistItem[] }) {
  return (
    <div className="media-rail">
      <h3>Исполнители</h3>
      <div className="artist-grid">
        {artists.map((artist) => (
          <div className="artist-chip" key={artist.id}>
            <strong>{artist.name}</strong>
            <small>{artist.album_count ?? 0} альб.</small>
          </div>
        ))}
        {!artists.length ? <EmptyState text="Исполнители пока не получены" /> : null}
      </div>
    </div>
  );
}

function MusicSearchResults({ albums, artists }: { albums: MusicAlbumItem[]; artists: MusicArtistItem[] }) {
  return (
    <section className="media-section">
      <div className="section-heading">
        <h2>Результаты Navidrome</h2>
        <span>{albums.length + artists.length}</span>
      </div>
      <AlbumRail title="Альбомы" albums={albums} />
      <ArtistGrid artists={artists} />
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="media-empty">{text}</p>;
}
