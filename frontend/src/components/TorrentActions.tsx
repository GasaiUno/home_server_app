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
      <button type="button" onClick={onPause} disabled={loading} title="Pause">
        <Pause size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={onResume} disabled={loading} title="Resume">
        <Play size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={onDelete} disabled={loading} title="Delete">
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
