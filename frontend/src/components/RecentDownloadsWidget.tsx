import type { YoutubeDownloadItem } from "../types";
import { formatBytes } from "../utils";

export function RecentDownloadsWidget({ items }: { items: YoutubeDownloadItem[] }) {
  return (
    <section className="panel compact-widget">
      <div className="panel-header">
        <h2>Последние загрузки</h2>
        <span>{items.length}</span>
      </div>
      {items.slice(0, 5).map((item) => (
        <article key={item.path} className="compact-row">
          <strong>{item.name}</strong>
          <small>{formatBytes(item.size)}</small>
        </article>
      ))}
      {items.length === 0 ? <p className="muted">Загрузок пока нет.</p> : null}
    </section>
  );
}
