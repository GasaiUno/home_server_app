import type { ReactNode } from "react";

type PageHeaderProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  status?: ReactNode;
};

export function PageHeader({ kicker, title, subtitle, action, status }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {kicker ? <p className="section-label">{kicker}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {status || action ? (
        <div className="page-header-actions">
          {status}
          {action}
        </div>
      ) : null}
    </header>
  );
}
