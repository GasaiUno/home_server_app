import { Activity, Clock3, ExternalLink, Gauge, RefreshCw, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  getAdminDocker,
  getAdminEvents,
  getAdminMetrics,
  getAdminServicesHealth,
  sendTestTelegramAlert
} from "../api";
import { DockerContainersTable } from "../components/DockerContainersTable";
import { EventsTimeline } from "../components/EventsTimeline";
import { MetricsGrid } from "../components/MetricsGrid";
import { PageHeader } from "../components/PageHeader";
import { ServicesHealthTable } from "../components/ServicesHealthTable";
import { TelegramAlertsStatus } from "../components/TelegramAlertsStatus";
import { TestTelegramAlertButton } from "../components/TestTelegramAlertButton";
import type {
  DockerContainer,
  EventItem,
  Notice,
  ServerMetrics,
  ServiceHealthItem,
  ServiceItem,
  StatusResponse,
  TelegramStatus
} from "../types";
import { formatServerTime, formatUptime, getErrorMessage } from "../utils";

type AdminTab = "overview" | "monitoring" | "downloads" | "automation" | "settings";

type AdminPageProps = {
  token: string;
  services: ServiceItem[];
  status: StatusResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onNotice: (notice: Notice) => void;
};

const tabs: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "monitoring", label: "Monitoring" },
  { id: "downloads", label: "Downloads" },
  { id: "automation", label: "Automation" },
  { id: "settings", label: "Settings" }
];

export function AdminPage({ token, services, status, loading, onRefresh, onNotice }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [health, setHealth] = useState<ServiceHealthItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [telegram, setTelegram] = useState<TelegramStatus | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [testAlertLoading, setTestAlertLoading] = useState(false);

  const loadMonitoring = useCallback(async () => {
    setMonitoringLoading(true);
    try {
      const [metricsPayload, dockerPayload, healthPayload, eventsPayload] = await Promise.all([
        getAdminMetrics(token),
        getAdminDocker(token),
        getAdminServicesHealth(token),
        getAdminEvents(token)
      ]);
      setMetrics(metricsPayload);
      setContainers(dockerPayload.containers);
      setHealth(healthPayload.services);
      setEvents(eventsPayload.events);
      setTelegram(eventsPayload.telegram);
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось загрузить мониторинг: ${getErrorMessage(error)}` });
    } finally {
      setMonitoringLoading(false);
    }
  }, [onNotice, token]);

  useEffect(() => {
    if (activeTab !== "monitoring") {
      return;
    }
    void loadMonitoring();
    const id = window.setInterval(() => {
      void loadMonitoring();
    }, 15000);
    return () => window.clearInterval(id);
  }, [activeTab, loadMonitoring]);

  async function handleTestAlert() {
    setTestAlertLoading(true);
    try {
      const response = await sendTestTelegramAlert(token);
      setTelegram(response.telegram);
      onNotice({
        type: response.status === "sent" ? "success" : "error",
        message: response.message
      });
      void loadMonitoring();
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось отправить тест: ${getErrorMessage(error)}` });
    } finally {
      setTestAlertLoading(false);
    }
  }

  return (
    <>
      <div className="admin-header-row">
        <PageHeader kicker="Admin Mode" title="Админ-панель" subtitle="Технический статус, мониторинг и webhook-действия." />
        <button
          className="icon-button"
          type="button"
          onClick={activeTab === "monitoring" ? loadMonitoring : onRefresh}
          aria-label="Обновить"
        >
          <RefreshCw size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <OverviewTab services={services} status={status} loading={loading} />
      ) : activeTab === "monitoring" ? (
        <section className="monitoring-page">
          <div className="monitoring-toolbar">
            <span className="muted">{monitoringLoading ? "Обновление..." : "Автообновление каждые 15 секунд"}</span>
            <TestTelegramAlertButton loading={testAlertLoading} onClick={handleTestAlert} />
          </div>
          <TelegramAlertsStatus telegram={telegram} />
          <MetricsGrid metrics={metrics} />
          <div className="monitoring-tables">
            <DockerContainersTable containers={containers} />
            <ServicesHealthTable services={health} />
          </div>
          <EventsTimeline events={events} />
        </section>
      ) : activeTab === "downloads" ? (
        <AdminLinkPanel
          title="Downloads"
          text="Формы YouTube и magnet находятся на странице Actions и используют существующие endpoints /api/youtube и /api/magnet."
          link="/actions"
          label="Открыть Actions"
        />
      ) : activeTab === "automation" ? (
        <AdminExternalPanel
          title="Automation"
          text="n8n доступен как отдельный сервис. Автоматизации остаются вне v0.1.2 UI."
          service={services.find((service) => service.id === "n8n")}
        />
      ) : (
        <AdminLinkPanel title="Settings" text="Token и режим открытия сервисов находятся в общей странице Settings." link="/settings" label="Открыть Settings" />
      )}
    </>
  );
}

function OverviewTab({ services, status, loading }: { services: ServiceItem[]; status: StatusResponse | null; loading: boolean }) {
  return (
    <>
      <section className="status-grid" aria-label="Статус сервера">
        <StatusTile icon={Activity} label="Backend" value={status?.status ?? (loading ? "loading" : "unknown")} />
        <StatusTile icon={Gauge} label="Uptime" value={status ? formatUptime(status.uptime_seconds) : "unknown"} />
        <StatusTile icon={Server} label="Version" value={status?.version ?? "0.1.2"} />
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
          <AdminLinkPanel
            title="Webhook-действия"
            text="Формы скачивания перенесены в отдельную страницу Actions и используют те же endpoints."
            link="/actions"
            label="Открыть Actions"
          />
        </section>
      </section>
    </>
  );
}

function AdminLinkPanel({ title, text, link, label }: { title: string; text: string; link: string; label: string }) {
  return (
    <div className="panel admin-action-panel">
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      <Link className="primary-link-button" to={link}>
        {label}
      </Link>
    </div>
  );
}

function AdminExternalPanel({ title, text, service }: { title: string; text: string; service?: ServiceItem }) {
  return (
    <div className="panel admin-action-panel">
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      {service ? (
        <a className="primary-link-button" href={service.url}>
          Открыть {service.name}
        </a>
      ) : null}
    </div>
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
