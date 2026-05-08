import type { TorrentItem } from "../types";
import { formatSpeed } from "../utils";
import { TorrentProgress } from "./TorrentProgress";

export function ActiveTorrentsWidget({ torrents }: { torrents: TorrentItem[] }) {
  return (
    <section className="panel compact-widget">
      <div className="panel-header">
        <h2>Активные торренты</h2>
        <span>{torrents.length}</span>
      </div>
      {torrents.slice(0, 4).map((torrent) => (
        <article key={torrent.hash} className="compact-row">
          <strong>{torrent.name}</strong>
          <TorrentProgress value={torrent.progress} />
          <small>↓ {formatSpeed(torrent.dlspeed)}</small>
        </article>
      ))}
      {torrents.length === 0 ? <p className="muted">Активных торрентов нет.</p> : null}
    </section>
  );
}
