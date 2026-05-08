import { HardDrive } from "lucide-react";
import type { DiskUsage } from "../types";
import { formatBytes, formatPercent, healthTone } from "../utils";

type DiskUsageCardProps = {
  title: string;
  usage: DiskUsage;
  path?: string;
};

export function DiskUsageCard({ title, usage, path }: DiskUsageCardProps) {
  const tone = healthTone(usage.percent);
  const width = Math.max(0, Math.min(100, usage.percent ?? 0));

  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card-head">
        <span className="metric-icon">
          <HardDrive size={21} aria-hidden="true" />
        </span>
        <span>{title}</span>
      </div>
      <strong>{formatPercent(usage.percent)}</strong>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
      <small>
        {formatBytes(usage.used)} занято из {formatBytes(usage.total)}
      </small>
      {path ? <small className="mono-text">{path}</small> : null}
    </article>
  );
}
