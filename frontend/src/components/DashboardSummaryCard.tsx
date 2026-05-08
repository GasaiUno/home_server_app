import type { DashboardSummary } from "../types";
import { formatPercent, formatSpeed } from "../utils";

export function DashboardSummaryCard({ summary }: { summary: DashboardSummary | null }) {
  return (
    <section className="summary-strip">
      <article>
        <span>CPU</span>
        <strong>{formatPercent(summary?.server.cpu_percent)}</strong>
      </article>
      <article>
        <span>RAM</span>
        <strong>{formatPercent(summary?.server.memory_percent)}</strong>
      </article>
      <article>
        <span>Диск</span>
        <strong>{formatPercent(summary?.server.disk_percent)}</strong>
      </article>
      <article>
        <span>Торренты</span>
        <strong>{summary?.torrents.active ?? 0}</strong>
      </article>
      <article>
        <span>Скорость</span>
        <strong>{formatSpeed(summary?.torrents.total_download_speed ?? 0)}</strong>
      </article>
    </section>
  );
}
