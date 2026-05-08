import type { DashboardSummary } from "../types";
import { formatPercent } from "../utils";

export function DiskUsageMiniWidget({ summary }: { summary: DashboardSummary | null }) {
  const percent = summary?.server.disk_percent ?? 0;
  return (
    <section className="panel compact-widget">
      <div className="panel-header">
        <h2>Свободное место</h2>
        <span>{formatPercent(percent)}</span>
      </div>
      <div className="progress-track">
        <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
      <p className="muted">Использование основного диска</p>
    </section>
  );
}
