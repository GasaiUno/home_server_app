import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

type GlassCardProps = {
  as?: "article" | "section" | "div";
  className?: string;
  variant?: "default" | "strong" | "subtle";
  children: ReactNode;
};

export function GlassCard({ as: Tag = "article", className = "", variant = "default", children }: GlassCardProps) {
  return <Tag className={`glass-card glass-${variant} ${className}`.trim()}>{children}</Tag>;
}

type BentoCardProps = {
  icon?: ComponentType<LucideProps>;
  title: string;
  description?: string;
  metric?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function BentoCard({ icon: Icon, title, description, metric, action, className = "" }: BentoCardProps) {
  return (
    <GlassCard className={`bento-card ${className}`}>
      <div className="bento-card-head">
        {Icon ? (
          <span className="bento-icon">
            <Icon size={20} aria-hidden="true" />
          </span>
        ) : null}
        <div>
          <h2>{title}</h2>
          {description ? <p className="muted">{description}</p> : null}
        </div>
      </div>
      {metric ? <div className="bento-metric">{metric}</div> : null}
      {action ? <div className="bento-action">{action}</div> : null}
    </GlassCard>
  );
}

type MetricPillProps = {
  label: string;
  value: string | number;
  status?: "neutral" | "success" | "warning" | "danger";
};

export function MetricPill({ label, value, status = "neutral" }: MetricPillProps) {
  return (
    <span className={`metric-pill metric-pill-${status}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

type StateProps = {
  icon?: ComponentType<LucideProps>;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: StateProps) {
  return (
    <div className="state-card empty-state">
      {Icon ? <Icon size={22} aria-hidden="true" /> : null}
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ icon: Icon, title, description, action }: StateProps) {
  return (
    <div className="state-card error-state">
      {Icon ? <Icon size={22} aria-hidden="true" /> : null}
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
