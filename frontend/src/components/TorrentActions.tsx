import { Pause, Play, Trash2 } from "lucide-react";

type TorrentActionsProps = {
  loading: boolean;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
};

export function TorrentActions({ loading, onPause, onResume, onDelete }: TorrentActionsProps) {
  return (
    <div className="torrent-actions">
      <button type="button" onClick={onPause} disabled={loading} title="Пауза" aria-label="Пауза">
        <Pause size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={onResume} disabled={loading} title="Продолжить" aria-label="Продолжить">
        <Play size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={onDelete} disabled={loading} title="Удалить" aria-label="Удалить">
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
