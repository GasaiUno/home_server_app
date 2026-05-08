import { ExternalLink, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { iconByKey } from "../icons";
import type { ServiceItem, ServiceTarget } from "../types";

type ServiceCardProps = {
  service: ServiceItem;
  target: ServiceTarget;
  toAdmin?: boolean;
};

export function ServiceCard({ service, target, toAdmin = false }: ServiceCardProps) {
  const Icon = iconByKey[service.icon] ?? Server;
  const className = `home-service-card accent-${service.accent}`;
  const content = (
    <>
      <span className="service-card-icon">
        <Icon size={28} aria-hidden="true" />
      </span>
      <span className="service-card-copy">
        <strong>{service.name}</strong>
        <small>{service.description}</small>
      </span>
      <ExternalLink size={18} aria-hidden="true" />
    </>
  );

  if (toAdmin) {
    return (
      <Link className={className} to="/admin">
        {content}
      </Link>
    );
  }

  return (
    <a className={className} href={service.url} target={target} rel={target === "_blank" ? "noreferrer" : undefined}>
      {content}
    </a>
  );
}
