import type { TorrentItem } from "../types";
import { formatBytes, formatEta, formatSpeed } from "../utils";
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
  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <h2>Торренты</h2>
        <span>{torrents.length}</span>
      </div>
      <div className="responsive-table">
        <table>
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
            {torrents.length === 0 ? (
              <tr>
                <td colSpan={7}>Торренты не найдены или qBittorrent недоступен.</td>
              </tr>
            ) : (
              torrents.map((torrent) => (
                <tr key={torrent.hash}>
                  <td>
                    <strong>{torrent.name}</strong>
                    <small>{formatBytes(torrent.size)}</small>
                  </td>
                  <td>{torrent.state}</td>
                  <td>
                    <TorrentProgress value={torrent.progress} />
                  </td>
                  <td>
                    <small>↓ {formatSpeed(torrent.dlspeed)}</small>
                    <small>↑ {formatSpeed(torrent.upspeed)}</small>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
