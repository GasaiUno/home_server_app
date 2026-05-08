import { Activity, Clock3, Cpu, MemoryStick, Server, Thermometer, Waves } from "lucide-react";
import type { ServerMetrics } from "../types";
import { formatBytes, formatServerTime, formatUptime } from "../utils";
import { DiskUsageCard } from "./DiskUsageCard";
import { MetricCard } from "./MetricCard";

type MetricsGridProps = {
  metrics: ServerMetrics | null;
};

export function MetricsGrid({ metrics }: MetricsGridProps) {
  if (!metrics) {
    return <div className="panel muted">Метрики загружаются...</div>;
  }

  return (
    <section className="monitoring-grid">
      <MetricCard
        title="CPU"
        value={metrics.cpu.percent}
        details={`Load: ${metrics.cpu.load_avg?.join(" / ") ?? "недоступно"} · ${metrics.cpu.cores_logical ?? "?"} потоков`}
        icon={Cpu}
      />
      <MetricCard
        title="RAM"
        value={metrics.memory.percent}
        details={`${formatBytes(metrics.memory.used)} из ${formatBytes(metrics.memory.total)}`}
        icon={MemoryStick}
      />
      <MetricCard
        title="Swap"
        value={metrics.swap.percent}
        details={`${formatBytes(metrics.swap.used)} из ${formatBytes(metrics.swap.total)}`}
        icon={Waves}
      />
      <MetricCard
        title="Температура"
        value={metrics.temperature.cpu}
        details={metrics.temperature.available ? "CPU sensor" : "Температура недоступна"}
        icon={Thermometer}
        suffix="°C"
      />
      <DiskUsageCard title="Disk /" usage={metrics.disk.root} />
      {metrics.disk.data ? <DiskUsageCard title="Data path" usage={metrics.disk.data} path={metrics.disk.data.path} /> : null}
      <article className="metric-card">
        <div className="metric-card-head">
          <span className="metric-icon">
            <Server size={21} aria-hidden="true" />
          </span>
          <span>Uptime сервера</span>
        </div>
        <strong>{metrics.uptime.server_uptime_seconds ? formatUptime(metrics.uptime.server_uptime_seconds) : "Недоступно"}</strong>
        <small>Backend: {formatUptime(metrics.uptime.backend_uptime_seconds)}</small>
      </article>
      <article className="metric-card">
        <div className="metric-card-head">
          <span className="metric-icon">
            <Clock3 size={21} aria-hidden="true" />
          </span>
          <span>Время</span>
        </div>
        <strong>{formatServerTime(metrics.uptime.server_time)}</strong>
        <small>Backend стартовал: {formatServerTime(metrics.uptime.backend_started_at)}</small>
      </article>
    </section>
  );
}
