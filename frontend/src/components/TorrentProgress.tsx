export function TorrentProgress({ value }: { value: number }) {
  const percent = Math.round(value * 1000) / 10;
  return (
    <div className="torrent-progress">
      <span>{percent}%</span>
      <div className="progress-track">
        <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}
