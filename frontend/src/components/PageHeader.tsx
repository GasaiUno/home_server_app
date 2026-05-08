type PageHeaderProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
};

export function PageHeader({ kicker, title, subtitle }: PageHeaderProps) {
  return (
    <header className="page-header">
      {kicker ? <p className="section-label">{kicker}</p> : null}
      <h1>{title}</h1>
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </header>
  );
}
