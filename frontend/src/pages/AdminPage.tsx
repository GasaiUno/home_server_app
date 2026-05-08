import { Activity, Clock3, ExternalLink, Gauge, RefreshCw, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import type { ServiceItem, StatusResponse } from "../types";
import { formatServerTime, formatUptime } from "../utils";

type AdminPageProps = {
  services: ServiceItem[];
  status: StatusResponse | null;
  loading: boolean;
  onRefresh: () => void;
};

export function AdminPage({ services, status, loading, onRefresh }: AdminPageProps) {
  return (
    <>
      <div className="admin-header-row">
        <PageHeader kicker="Admin Mode" title="Админ-панель" subtitle="Технический статус, список сервисов и webhook-действия." />
        <button className="icon-button" type="button" onClick={onRefresh} aria-label="Обновить">
          <RefreshCw size={18} aria-hidden="true" />
        </button>
      </div>

      <section className="status-grid" aria-label="Статус сервера">
        <StatusTile icon={Activity} label="Backend" value={status?.status ?? (loading ? "loading" : "unknown")} />
        <StatusTile icon={Gauge} label="Uptime" value={status ? formatUptime(status.uptime_seconds) : "unknown"} />
        <StatusTile icon={Server} label="Version" value={status?.version ?? "0.1.1"} />
        <StatusTile icon={Clock3} label="Server time" value={formatServerTime(status?.server_time)} />
      </section>

      <section className="content-grid">
        <section className="panel services-panel">
          <div className="panel-header">
            <h2>Сервисы</h2>
            <span>{services.length || "..."}</span>
          </div>
          {loading ? <p className="muted">Загрузка сервисов...</p> : null}
          <div className="admin-services-grid">
            {services.map((service) => (
              <a key={service.id} className="admin-service-card" href={service.url} target="_blank" rel="noreferrer">
                <span>
                  <strong>{service.name}</strong>
                  <small>{service.description}</small>
                </span>
                <ExternalLink size={17} aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        <section className="forms-column">
          <div className="panel admin-action-panel">
            <h2>Webhook-действия</h2>
            <p className="muted">Формы скачивания перенесены в отдельную страницу Actions и используют те же endpoints.</p>
            <Link className="primary-link-button" to="/actions">
              Открыть Actions
            </Link>
          </div>
        </section>
      </section>
    </>
  );
}

function StatusTile({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <article className="status-tile">
      <Icon size={20} aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
