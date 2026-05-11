import { Inbox } from "lucide-react";
import type { TorrentItem } from "../types";
import { formatBytes, formatEta, formatSpeed } from "../utils";
import { EmptyState, MetricPill, SkeletonCard } from "./Surface";
import { TorrentActions } from "./TorrentActions";
import { TorrentProgress } from "./TorrentProgress";

type TorrentTableProps = {
  torrents: TorrentItem[];
  loading: boolean;
  onPause: (hash: string) => void;
  onResume: (hash: string) => void;
  onDelete: (torrent: TorrentItem) => void;
};

export function TorrentTable({ torrents, loading, onPause, onResume, onDelete }: TorrentTableProps) {
  const active = torrents.filter((torrent) => torrent.dlspeed > 0 || torrent.upspeed > 0).length;
  const completed = torrents.filter((torrent) => torrent.progress >= 1).length;
  const downSpeed = torrents.reduce((total, torrent) => total + torrent.dlspeed, 0);
  const upSpeed = torrents.reduce((total, torrent) => total + torrent.upspeed, 0);

  return (
    <section className="panel table-panel downloads-panel">
      <div className="panel-header">
        <div>
          <h2>Downloads</h2>
          <p className="muted">qBittorrent queue, progress and compact actions.</p>
        </div>
        <span>{torrents.length}</span>
      </div>
      <div className="download-summary">
        <MetricPill label="active" value={active} status={active ? "success" : "neutral"} />
        <MetricPill label="down" value={formatSpeed(downSpeed)} />
        <MetricPill label="up" value={formatSpeed(upSpeed)} />
        <MetricPill label="done" value={completed} />
      </div>
      {loading && torrents.length === 0 ? <SkeletonCard lines={4} /> : null}
      {!loading && torrents.length === 0 ? (
        <EmptyState icon={Inbox} title="Загрузок нет" description="Очередь пуста или qBittorrent сейчас недоступен." />
      ) : null}
      <div className="responsive-table">
        <table className={torrents.length === 0 ? "is-empty" : ""}>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Статус</th>
              <th>Прогресс</th>
              <th>Скорость</th>
              <th>ETA</th>
              <th>Категория</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {torrents.map((torrent) => (
                <tr key={torrent.hash}>
                  <td>
                    <strong>{torrent.name}</strong>
                    <small>{formatBytes(torrent.size)}</small>
                  </td>
                  <td>
                    <span className={`status-pill torrent-state ${torrentStateTone(torrent.state)}`}>{torrent.state}</span>
                  </td>
                  <td>
                    <TorrentProgress value={torrent.progress} />
                  </td>
                  <td>
                    <span className="speed-stack">
                    <small>↓ {formatSpeed(torrent.dlspeed)}</small>
                    <small>↑ {formatSpeed(torrent.upspeed)}</small>
                    </span>
                  </td>
                  <td>{formatEta(torrent.eta)}</td>
                  <td>{torrent.category || "—"}</td>
                  <td>
                    <TorrentActions
                      loading={loading}
                      onPause={() => onPause(torrent.hash)}
                      onResume={() => onResume(torrent.hash)}
                      onDelete={() => onDelete(torrent)}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function torrentStateTone(state: string): string {
  const normalized = state.toLowerCase();
  if (normalized.includes("error") || normalized.includes("missing")) return "tone-critical";
  if (normalized.includes("pause") || normalized.includes("stalled")) return "tone-warning";
  if (normalized.includes("down") || normalized.includes("up") || normalized.includes("check")) return "tone-success";
  return "tone-neutral";
}
