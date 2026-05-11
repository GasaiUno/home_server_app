import { Activity, Clock3, ExternalLink, Gauge, RefreshCw, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  deleteTorrent,
  getFiles,
  getAdminDocker,
  getAdminEvents,
  getAdminMetrics,
  getAdminServiceLogs,
  getAdminServicesRegistry,
  getAdminServicesHealth,
  getTorrents,
  pauseTorrent,
  resumeTorrent,
  sendTestTelegramAlert
} from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DockerContainersTable } from "../components/DockerContainersTable";
import { EventsTimeline } from "../components/EventsTimeline";
import { FileBrowser } from "../components/FileBrowser";
import { MetricsGrid } from "../components/MetricsGrid";
import { PageHeader } from "../components/PageHeader";
import { ServicesHealthTable } from "../components/ServicesHealthTable";
import { TelegramAlertsStatus } from "../components/TelegramAlertsStatus";
import { TestTelegramAlertButton } from "../components/TestTelegramAlertButton";
import { TorrentTable } from "../components/TorrentTable";
import type {
  AdminRegistryService,
  DockerContainer,
  EventItem,
  Notice,
  ServerMetrics,
  FilesListResponse,
  ServiceHealthItem,
  ServiceItem,
  StatusResponse,
  TelegramStatus,
  TorrentItem
} from "../types";
import { formatServerTime, formatUptime, getErrorMessage } from "../utils";

type AdminTab = "overview" | "monitoring" | "downloads" | "files" | "services" | "events" | "settings";

type AdminPageProps = {
  token: string;
  services: ServiceItem[];
  status: StatusResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onNotice: (notice: Notice) => void;
};

const tabs: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Состояние сервера" },
  { id: "monitoring", label: "Мониторинг" },
  { id: "downloads", label: "Очередь" },
  { id: "files", label: "Хранилище" },
  { id: "services", label: "Сервисы" },
  { id: "events", label: "События" },
  { id: "settings", label: "Уведомления" }
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
  const [torrents, setTorrents] = useState<TorrentItem[]>([]);
  const [torrentLoading, setTorrentLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TorrentItem | null>(null);
  const [files, setFiles] = useState<FilesListResponse | null>(null);
  const [filePath, setFilePath] = useState("media");
  const [filesLoading, setFilesLoading] = useState(false);
  const [registry, setRegistry] = useState<AdminRegistryService[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [logsService, setLogsService] = useState<AdminRegistryService | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

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

  useEffect(() => {
    if (activeTab === "services" || activeTab === "events") {
      void loadMonitoring();
    }
  }, [activeTab, loadMonitoring]);

  const loadRegistry = useCallback(async () => {
    setRegistryLoading(true);
    try {
      const payload = await getAdminServicesRegistry(token);
      setRegistry(payload.services);
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось загрузить список разрешённых сервисов: ${getErrorMessage(error)}` });
    } finally {
      setRegistryLoading(false);
    }
  }, [onNotice, token]);

  useEffect(() => {
    if (activeTab === "services") void loadRegistry();
  }, [activeTab, loadRegistry]);

  const loadTorrents = useCallback(async () => {
    setTorrentLoading(true);
    try {
      const payload = await getTorrents(token);
      setTorrents(payload.items);
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось загрузить торренты: ${getErrorMessage(error)}` });
    } finally {
      setTorrentLoading(false);
    }
  }, [onNotice, token]);

  useEffect(() => {
    if (activeTab !== "downloads") return;
    void loadTorrents();
    const id = window.setInterval(() => void loadTorrents(), 8000);
    return () => window.clearInterval(id);
  }, [activeTab, loadTorrents]);

  const loadFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      setFiles(await getFiles(token, filePath));
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось открыть файлы: ${getErrorMessage(error)}` });
    } finally {
      setFilesLoading(false);
    }
  }, [filePath, onNotice, token]);

  useEffect(() => {
    if (activeTab === "files") void loadFiles();
  }, [activeTab, loadFiles]);

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

  async function runTorrentAction(action: "pause" | "resume", hash: string) {
    setTorrentLoading(true);
    try {
      if (action === "pause") await pauseTorrent(token, hash);
      else await resumeTorrent(token, hash);
      onNotice({ type: "success", message: action === "pause" ? "Торрент поставлен на паузу" : "Торрент продолжен" });
      await loadTorrents();
    } catch (error) {
      onNotice({ type: "error", message: `Действие не выполнено: ${getErrorMessage(error)}` });
    } finally {
      setTorrentLoading(false);
    }
  }

  async function confirmDeleteTorrent() {
    if (!pendingDelete) return;
    setTorrentLoading(true);
    try {
      await deleteTorrent(token, pendingDelete.hash, false);
      onNotice({ type: "success", message: "Торрент удалён из списка" });
      setPendingDelete(null);
      await loadTorrents();
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось удалить торрент: ${getErrorMessage(error)}` });
    } finally {
      setTorrentLoading(false);
    }
  }

  async function openServiceLogs(service: AdminRegistryService) {
    setLogsService(service);
    setLogs([]);
    setLogsLoading(true);
    try {
      const payload = await getAdminServiceLogs(token, service.key, 200);
      setLogs(payload.logs);
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось открыть логи: ${getErrorMessage(error)}` });
    } finally {
      setLogsLoading(false);
    }
  }

  return (
    <>
      <div className="admin-header-row">
        <PageHeader kicker="обслуживание" title="Админка" subtitle="Мониторинг, сервисы, события и настройки сервера." />
        <button
          className="icon-button"
          type="button"
          onClick={
            activeTab === "monitoring" || activeTab === "services" || activeTab === "events"
              ? activeTab === "services"
                ? () => {
                    void loadMonitoring();
                    void loadRegistry();
                  }
                : loadMonitoring
              : activeTab === "downloads"
                ? loadTorrents
                : activeTab === "files"
                  ? loadFiles
                  : onRefresh
          }
          aria-label="Обновить"
        >
          <RefreshCw size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Разделы админки">
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
        <TorrentTable
          torrents={torrents}
          loading={torrentLoading}
          onPause={(hash) => void runTorrentAction("pause", hash)}
          onResume={(hash) => void runTorrentAction("resume", hash)}
          onDelete={setPendingDelete}
        />
      ) : activeTab === "files" ? (
        <FileBrowser
          token={token}
          data={files}
          path={filePath}
          loading={filesLoading}
          onNavigate={setFilePath}
          onRefresh={loadFiles}
          onNotice={onNotice}
        />
      ) : activeTab === "services" ? (
        <ServicesFoundationPanel services={registry} loading={registryLoading} health={health} onViewLogs={(service) => void openServiceLogs(service)} />
      ) : activeTab === "events" ? (
        <EventsTimeline events={events} />
      ) : (
        <AdminLinkPanel title="Настройки" text="Токен и режим открытия сервисов находятся на общей странице настроек." link="/settings" label="Открыть настройки" />
      )}
      {pendingDelete ? (
        <ConfirmDialog
          title="Удалить торрент?"
          text={`Удалить "${pendingDelete.name}" из qBittorrent? Файлы останутся на диске.`}
          confirmLabel="Удалить"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDeleteTorrent}
        />
      ) : null}
      {logsService ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirm-dialog service-logs-dialog" role="dialog" aria-modal="true" aria-label={`Логи ${logsService.display_name}`}>
            <h2>Логи {logsService.display_name}</h2>
            <p className="muted">{logsLoading ? "Загрузка..." : `${logs.length} строк, только чтение`}</p>
            <pre className="logs-pre">{logs.length ? logs.join("\n") : "Логов нет"}</pre>
            <div className="dialog-actions">
              <button type="button" className="secondary-muted-button" onClick={() => setLogsService(null)}>
                Закрыть
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ServicesFoundationPanel({
  services,
  loading,
  health,
  onViewLogs
}: {
  services: AdminRegistryService[];
  loading: boolean;
  health: ServiceHealthItem[];
  onViewLogs: (service: AdminRegistryService) => void;
}) {
  const healthById = new Map(health.map((item) => [item.id, item]));
  return (
    <>
      <section className="panel services-panel">
        <div className="panel-header">
          <div>
            <h2>Разрешённые сервисы</h2>
            <p className="muted">Whitelist для будущего управления: сейчас доступны только безопасные логи.</p>
          </div>
          <span>{loading ? "..." : services.length}</span>
        </div>
        {services.length === 0 ? <p className="muted">{loading ? "Загрузка списка..." : "Список пуст"}</p> : null}
        <div className="admin-services-grid registry-grid">
          {services.map((service) => {
            const serviceHealth = healthById.get(service.key);
            return (
              <article key={service.key} className="admin-service-card registry-card">
                <span>
                  <strong>{service.display_name}</strong>
                  <small className="mono-text">{service.container_name}</small>
                  <small>
                    {service.category} / риск: {dangerLabel(service.danger_level)}
                  </small>
                  <small>
                    разрешено: {allowedActions(service)}
                    {serviceHealth ? ` / ${serviceHealth.online ? "работает" : "недоступен"}` : ""}
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
                      Логи
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <ServicesHealthTable services={health} />
    </>
  );
}

function allowedActions(service: AdminRegistryService): string {
  return [
    service.allow_logs ? "логи" : null,
    service.allow_restart ? "перезапуск" : null,
    service.allow_start ? "запуск" : null,
    service.allow_stop ? "остановка" : null
  ]
    .filter(Boolean)
    .join(", ");
}

function dangerLabel(level: AdminRegistryService["danger_level"]): string {
  if (level === "low") return "низкий";
  if (level === "medium") return "средний";
  return "высокий";
}

function OverviewTab({ services, status, loading }: { services: ServiceItem[]; status: StatusResponse | null; loading: boolean }) {
  return (
    <>
      <section className="status-grid" aria-label="Статус сервера">
        <StatusTile icon={Activity} label="API" value={status?.status === "ok" ? "работает" : loading ? "загрузка" : "неизвестно"} />
        <StatusTile icon={Gauge} label="Время работы" value={status ? formatUptime(status.uptime_seconds) : "неизвестно"} />
        <StatusTile icon={Server} label="Версия" value={status?.version ?? "0.2.3"} />
        <StatusTile icon={Clock3} label="Время сервера" value={formatServerTime(status?.server_time)} />
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
            text="Формы скачивания находятся на странице Действия и используют те же endpoints."
            link="/actions"
            label="Открыть действия"
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
