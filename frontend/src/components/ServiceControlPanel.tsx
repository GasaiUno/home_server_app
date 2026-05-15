import { ExternalLink, FileText, Play, RotateCw, Square } from "lucide-react";
import type { AdminRegistryService, ServiceAction } from "../types";

type Props = {
  services: AdminRegistryService[];
  loading: boolean;
  onViewLogs: (service: AdminRegistryService) => void;
  onRunAction: (service: AdminRegistryService, action: ServiceAction) => void;
};

export function ServiceControlPanel({ services, loading, onViewLogs, onRunAction }: Props) {
  return (
    <section className="panel services-panel">
      <div className="panel-header">
        <div>
          <h2>Управление сервисами</h2>
          <p className="muted">Только разрешённые контейнеры из whitelist. Опасные действия требуют подтверждения.</p>
        </div>
        <span>{loading ? "..." : services.length}</span>
      </div>
      <div className="admin-services-grid registry-grid">
        {services.map((service) => (
          <article key={service.key} className="admin-service-card registry-card">
            <span>
              <strong>{service.display_name}</strong>
              <small className="mono-text">{service.container_name}</small>
              <small>
                {service.category} / риск: {service.danger_level}
              </small>
            </span>
            <div className="registry-actions">
              {service.url ? (
                <a className="icon-button" href={service.url} target="_blank" rel="noreferrer" aria-label={`Открыть ${service.display_name}`}>
                  <ExternalLink size={17} aria-hidden="true" />
                </a>
              ) : null}
              {service.allow_logs ? (
                <button type="button" className="secondary-muted-button compact-button" onClick={() => onViewLogs(service)}>
                  <FileText size={15} aria-hidden="true" />
                  Логи
                </button>
              ) : null}
              {service.allow_restart ? (
                <button type="button" className="secondary-muted-button compact-button" onClick={() => onRunAction(service, "restart")}>
                  <RotateCw size={15} aria-hidden="true" />
                  Restart
                </button>
              ) : null}
              {service.allow_start ? (
                <button type="button" className="secondary-muted-button compact-button" onClick={() => onRunAction(service, "start")}>
                  <Play size={15} aria-hidden="true" />
                  Start
                </button>
              ) : null}
              {service.allow_stop ? (
                <button type="button" className="danger-inline-button compact-button" onClick={() => onRunAction(service, "stop")}>
                  <Square size={15} aria-hidden="true" />
                  Stop
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
