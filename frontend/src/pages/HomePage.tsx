import {
  Activity,
  Bell,
  BookOpen,
  Bot,
  Download,
  Film,
  Folder,
  HardDrive,
  Link2,
  Music,
  Play,
  Radio,
  Server,
  Settings,
  ShieldCheck,
  Upload,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminEvents, getDashboardSummary, getTorrents, getYoutubeDownloads } from "../api";
import type {
  DashboardSummary,
  EventItem,
  ServiceItem,
  ServiceTarget,
  StatusResponse,
  TorrentItem,
  YoutubeDownloadItem
} from "../types";
import { findServiceUrl, formatSpeed } from "../utils";

type HomePageProps = {
  token: string;
  services: ServiceItem[];
  status: StatusResponse | null;
  loading: boolean;
  serviceTarget: ServiceTarget;
};

type HubAction = {
  label: string;
  to?: string;
  href?: string;
  primary?: boolean;
};

type ScenarioPanelProps = {
  title: string;
  text: string;
  icon: LucideIcon;
  className: string;
  meta: string[];
  actions: HubAction[];
  target: ServiceTarget;
};

const serviceUrlFallbacks: Record<string, string> = {
  prowlarr: "http://10.8.1.5:9696",
  radarr: "http://10.8.1.5:7878",
  sonarr: "http://10.8.1.5:8989"
};

export function HomePage({ token, services, status, loading, serviceTarget }: HomePageProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [torrents, setTorrents] = useState<TorrentItem[]>([]);
  const [downloads, setDownloads] = useState<YoutubeDownloadItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    void Promise.allSettled([getDashboardSummary(token), getTorrents(token), getYoutubeDownloads(token), getAdminEvents(token)]).then((results) => {
      if (results[0].status === "fulfilled") setSummary(results[0].value);
      if (results[1].status === "fulfilled") setTorrents(results[1].value.items);
      if (results[2].status === "fulfilled") setDownloads(results[2].value.items);
      if (results[3].status === "fulfilled") setEvents(results[3].value.events);
    });
  }, [token]);

  const serviceUrl = (id: string) => {
    const url = findServiceUrl(services, id);
    return url === "#" ? (serviceUrlFallbacks[id] ?? "#") : url;
  };
  const activeTorrents = torrents.filter((torrent) => torrent.dlspeed > 0 || torrent.upspeed > 0);
  const totalDownloadSpeed = torrents.reduce((total, torrent) => total + torrent.dlspeed, 0);
  const totalUploadSpeed = torrents.reduce((total, torrent) => total + torrent.upspeed, 0);
  const onlineServices = summary?.services.online ?? 0;
  const offlineServices = summary?.services.offline ?? 0;
  const serverLabel = offlineServices > 0 ? "есть проблемы" : loading ? "проверяем сервер" : "всё работает";

  return (
    <div className="media-hub-page">
      <MediaHero
        status={status}
        loading={loading}
        serverLabel={serverLabel}
        onlineServices={onlineServices || services.length}
        offlineServices={offlineServices}
        summary={summary}
        activeTorrents={activeTorrents.length}
        jellyfinUrl={serviceUrl("jellyfin")}
        navidromeUrl={serviceUrl("navidrome")}
        target={serviceTarget}
      />

      <section className="media-hub-layout" aria-label="Медиа-хаб">
        <ScenarioPanel
          className="scenario-cinema"
          title="Смотреть"
          text="Фильмы, сериалы и домашняя медиатека через Jellyfin. Radarr и Sonarr рядом, когда нужно пополнить коллекцию."
          icon={Film}
          meta={["Jellyfin", "Radarr", "Sonarr"]}
          target={serviceTarget}
          actions={[
            { label: "Смотреть фильмы", href: serviceUrl("jellyfin"), primary: true },
            { label: "Фильмы", href: serviceUrl("radarr") },
            { label: "Сериалы", href: serviceUrl("sonarr") }
          ]}
        />
        <ScenarioPanel
          className="scenario-music"
          title="Слушать"
          text="Музыка с домашнего сервера без лишних экранов: открыть Navidrome и продолжить библиотеку."
          icon={Music}
          meta={["Navidrome", "музыка", "плейлисты"]}
          target={serviceTarget}
          actions={[{ label: "Открыть музыку", href: serviceUrl("navidrome"), primary: true }]}
        />
        <DownloadsHub
          active={activeTorrents.length}
          downSpeed={totalDownloadSpeed}
          upSpeed={totalUploadSpeed}
          qbUrl={serviceUrl("qbittorrent")}
          prowlarrUrl={serviceUrl("prowlarr")}
          target={serviceTarget}
        />
        <ScenarioPanel
          className="scenario-files"
          title="Файлы"
          text="Медиа, музыка, книги, YouTube-загрузки и документы в одном файловом разделе."
          icon={Folder}
          meta={["File Browser", "книги", "YouTube"]}
          target={serviceTarget}
          actions={[
            { label: "Открыть файлы", to: "/files", primary: true },
            { label: "Книги", to: "/files" },
            { label: "Загрузить файл", to: "/files" }
          ]}
        />
      </section>

      <section className="hub-bottom-rail">
        <NowPlayingFeed activeTorrents={activeTorrents} downloads={downloads} events={events} offlineServices={offlineServices} disk={summary?.server.disk_percent} />
        <QuickCommandRail />
        <MaintenancePanel offlineServices={offlineServices} onlineServices={onlineServices || services.length} status={status?.status} />
      </section>
    </div>
  );
}

function MediaHero({
  status,
  loading,
  serverLabel,
  onlineServices,
  offlineServices,
  summary,
  activeTorrents,
  jellyfinUrl,
  navidromeUrl,
  target
}: {
  status: StatusResponse | null;
  loading: boolean;
  serverLabel: string;
  onlineServices: number;
  offlineServices: number;
  summary: DashboardSummary | null;
  activeTorrents: number;
  jellyfinUrl: string;
  navidromeUrl: string;
  target: ServiceTarget;
}) {
  return (
    <section className="media-hero" aria-label="Домашний сервер">
      <div className="media-hero-copy">
        <h1>Домашний сервер</h1>
        <p>Фильмы, музыка, загрузки и файлы в одном домашнем медиа-хабе.</p>
        <div className="media-hero-actions">
          <a className="hub-button hub-button-primary" href={jellyfinUrl} target={target} rel={target === "_blank" ? "noreferrer" : undefined}>
            <Play size={18} aria-hidden="true" />
            Смотреть фильмы
          </a>
          <a className="hub-button" href={navidromeUrl} target={target} rel={target === "_blank" ? "noreferrer" : undefined}>
            <Music size={18} aria-hidden="true" />
            Слушать музыку
          </a>
          <Link className="hub-button" to="/actions">
            <Download size={18} aria-hidden="true" />
            Добавить загрузку
          </Link>
        </div>
      </div>
      <aside className="media-status-glass">
        <div className="status-orb" aria-hidden="true" />
        <strong>{serverLabel}</strong>
        <span>{loading ? "Проверяем сервер" : status?.status === "ok" ? `${onlineServices} сервисов доступно` : "API недоступен"}</span>
        <div className="status-mini-grid">
          <span>
            <small>CPU</small>
            <b>{summary?.server.cpu_percent != null ? `${summary.server.cpu_percent}%` : "—"}</b>
          </span>
          <span>
            <small>RAM</small>
            <b>{summary?.server.memory_percent != null ? `${summary.server.memory_percent}%` : "—"}</b>
          </span>
          <span>
            <small>Диск</small>
            <b>{summary?.server.disk_percent != null ? `${summary.server.disk_percent}%` : "—"}</b>
          </span>
          <span>
            <small>Загрузки</small>
            <b>{activeTorrents}</b>
          </span>
        </div>
        {offlineServices > 0 ? <Link to="/admin">Проверить проблемы</Link> : null}
      </aside>
    </section>
  );
}

function ScenarioPanel({ title, text, icon: Icon, className, meta, actions, target }: ScenarioPanelProps) {
  return (
    <article className={`scenario-panel ${className}`}>
      <div className="scenario-icon">
        <Icon size={28} aria-hidden="true" />
      </div>
      <div className="scenario-copy">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="scenario-meta">
        {meta.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="scenario-actions">
        {actions.map((action) =>
          action.to ? (
            <Link key={action.label} className={action.primary ? "hub-button hub-button-primary" : "hub-button"} to={action.to}>
              {action.label}
            </Link>
          ) : (
            <a
              key={action.label}
              className={action.primary ? "hub-button hub-button-primary" : "hub-button"}
              href={action.href}
              target={target}
              rel={target === "_blank" ? "noreferrer" : undefined}
            >
              {action.label}
            </a>
          )
        )}
      </div>
    </article>
  );
}

function DownloadsHub({
  active,
  downSpeed,
  upSpeed,
  qbUrl,
  prowlarrUrl,
  target
}: {
  active: number;
  downSpeed: number;
  upSpeed: number;
  qbUrl: string;
  prowlarrUrl: string;
  target: ServiceTarget;
}) {
  return (
    <article className="scenario-panel scenario-downloads">
      <div className="scenario-icon">
        <Download size={28} aria-hidden="true" />
      </div>
      <div className="scenario-copy">
        <h2>Скачать</h2>
        <p>Торренты, YouTube и индексаторы собраны в одном потоке загрузок.</p>
      </div>
      <div className="download-live-strip">
        <span>
          <small>активные</small>
          <b>{active}</b>
        </span>
        <span>
          <small>загрузка</small>
          <b>{formatSpeed(downSpeed)}</b>
        </span>
        <span>
          <small>отдача</small>
          <b>{formatSpeed(upSpeed)}</b>
        </span>
      </div>
      <div className="scenario-actions">
        <a className="hub-button hub-button-primary" href={qbUrl} target={target} rel={target === "_blank" ? "noreferrer" : undefined}>
          qBittorrent
        </a>
        <Link className="hub-button" to="/actions">
          Скачать YouTube
        </Link>
        <a className="hub-button" href={prowlarrUrl} target={target} rel={target === "_blank" ? "noreferrer" : undefined}>
          Prowlarr
        </a>
      </div>
    </article>
  );
}

function NowPlayingFeed({
  activeTorrents,
  downloads,
  events,
  offlineServices,
  disk
}: {
  activeTorrents: TorrentItem[];
  downloads: YoutubeDownloadItem[];
  events: EventItem[];
  offlineServices: number;
  disk: number | null | undefined;
}) {
  const rows = [
    {
      icon: Zap,
      label: "Торренты",
      value: activeTorrents[0]?.name ?? "Нет активных загрузок",
      to: "/downloads"
    },
    {
      icon: Radio,
      label: "YouTube",
      value: downloads[0]?.name ?? "Новые загрузки появятся здесь",
      to: "/actions"
    },
    {
      icon: Bell,
      label: "События",
      value: events[0]?.message ?? "Предупреждений сейчас нет",
      to: "/admin"
    },
    {
      icon: HardDrive,
      label: "Диск",
      value: disk != null ? `${disk}% занято` : "Данные о диске загружаются",
      to: "/admin"
    }
  ];

  return (
    <section className="now-feed" aria-label="Сейчас происходит">
      <div className="hub-section-title">
        <h2>Сейчас происходит</h2>
        <span>{offlineServices > 0 ? `${offlineServices} сервисов требуют внимания` : "спокойный режим"}</span>
      </div>
      <div className="now-feed-list">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <Link key={row.label} className="now-feed-row" to={row.to}>
              <Icon size={18} aria-hidden="true" />
              <span>
                <small>{row.label}</small>
                <strong>{row.value}</strong>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function QuickCommandRail() {
  return (
    <section className="quick-command-rail" aria-label="Быстрые команды">
      <div className="hub-section-title">
        <h2>Быстрые команды</h2>
        <span>для загрузок и файлов</span>
      </div>
      <div className="quick-command-list">
        <CommandLink icon={Link2} label="Скачать YouTube" to="/actions" />
        <CommandLink icon={Download} label="Добавить magnet" to="/actions" />
        <CommandLink icon={Upload} label="Загрузить .torrent" to="/actions" />
        <CommandLink icon={Folder} label="Загрузить файл" to="/files" />
        <CommandLink icon={BookOpen} label="Открыть книги" to="/files" />
      </div>
    </section>
  );
}

function CommandLink({ icon: Icon, label, to }: { icon: LucideIcon; label: string; to: string }) {
  return (
    <Link className="command-link" to={to}>
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function MaintenancePanel({
  offlineServices,
  onlineServices,
  status
}: {
  offlineServices: number;
  onlineServices: number;
  status: string | undefined;
}) {
  return (
    <section className="maintenance-panel" aria-label="Обслуживание">
      <div className="hub-section-title">
        <h2>Обслуживание</h2>
        <span>второй уровень</span>
      </div>
      <div className="maintenance-body">
        <div>
          <Server size={22} aria-hidden="true" />
          <strong>{status === "ok" ? "API работает" : "API недоступен"}</strong>
          <small>{onlineServices} сервисов доступно</small>
        </div>
        <div>
          <ShieldCheck size={22} aria-hidden="true" />
          <strong>{offlineServices > 0 ? "нужно внимание" : "без критичных проблем"}</strong>
          <small>Docker, события, уведомления</small>
        </div>
      </div>
      <div className="scenario-actions">
        <Link className="hub-button hub-button-primary" to="/admin">
          <Activity size={17} aria-hidden="true" />
          Мониторинг
        </Link>
        <Link className="hub-button" to="/settings">
          <Settings size={17} aria-hidden="true" />
          Настройки
        </Link>
      </div>
    </section>
  );
}
