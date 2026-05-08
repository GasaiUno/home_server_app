import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  href?: string;
};

export function QuickActionCard({ title, description, icon: Icon, to, href }: QuickActionCardProps) {
  const content = (
    <>
      <span className="quick-icon">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </>
  );

  if (to) {
    return (
      <Link className="quick-action-card" to={to}>
        {content}
      </Link>
    );
  }

  return (
    <a className="quick-action-card" href={href}>
      {content}
    </a>
  );
}
