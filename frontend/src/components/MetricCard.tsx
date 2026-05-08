import { LucideIcon } from "lucide-react";
import { formatPercent, healthTone } from "../utils";

type MetricCardProps = {
  title: string;
  value: number | null | undefined;
  details: string;
  icon: LucideIcon;
  suffix?: string;
};

export function MetricCard({ title, value, details, icon: Icon, suffix = "%" }: MetricCardProps) {
  const percent = suffix === "%" ? value : null;
  const tone = healthTone(percent);
  const width = Math.max(0, Math.min(100, value ?? 0));

  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card-head">
        <span className="metric-icon">
          <Icon size={21} aria-hidden="true" />
        </span>
        <span>{title}</span>
      </div>
      <strong>{suffix === "%" ? formatPercent(value) : value === null || value === undefined ? "Недоступно" : `${value}${suffix}`}</strong>
      {suffix === "%" ? (
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${width}%` }} />
        </div>
      ) : null}
      <small>{details}</small>
    </article>
  );
}
