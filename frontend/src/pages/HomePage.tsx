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
  Settings,
  ShieldCheck,
  Upload,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminEvents, getDashboardSummary, getTorrents, getYoutubeDownloads } from "../api";
import { QuickActionCard } from "../components/QuickActionCard";
import { StatusBadge } from "../components/StatusBadge";
import { MetricPill } from "../components/Surface";
import type { DashboardSummary, EventItem, ServiceItem, ServiceTarget, StatusResponse, TorrentItem, YoutubeDownloadItem } from "../types";
import { findServiceUrl } from "../utils";

type HomePageProps = {
  token: string;
  services: ServiceItem[];
  status: StatusResponse | null;
  loading: boolean;
  serviceTarget: ServiceTarget;
};

type ServiceGroup = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  services: string[];
  actions: Array<{ label: string; to?: string; href?: string }>;
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
  const onlineServices = summary?.services.online ?? 0;
  const offlineServices = summary?.services.offline ?? 0;
  const serviceStatusText = offlineServices > 0 ? "есть проблемы" : onlineServices > 0 ? "всё работает" : "проверяем";
  const serviceStatusTone = offlineServices > 0 ? "warning" : onlineServices > 0 ? "online" : "neutral";

  const serviceGroups = useMemo<ServiceGroup[]>(
    () => [
      {
        title: "Фильмы и сериалы",
        description: "Смотреть медиатеку, управлять фильмами и сериалами.",
        icon: Film,
        accent: "violet",
        services: ["Jellyfin", "Radarr", "Sonarr"],
        actions: [
          { label: "Открыть Jellyfin", href: serviceUrl("jellyfin") },
          { label: "Фильмы", href: serviceUrl("radarr") || serviceUrl("jellyfin") },
          { label: "Сериалы", href: serviceUrl("sonarr") || serviceUrl("jellyfin") }
        ]
      },
      {
        title: "Музыка",
        description: "Слушать музыку с домашнего сервера.",
        icon: Music,
        accent: "teal",
        services: ["Navidrome"],
        actions: [{ label: "Открыть музыку", href: serviceUrl("navidrome") }]
      },
      {
        title: "Загрузки",
        description: "Торренты, YouTube-загрузки и индексаторы.",
        icon: Download,
        accent: "blue",
        services: ["qBittorrent", "MeTube", "Prowlarr"],
        actions: [
          { label: "Торренты", href: serviceUrl("qbittorrent") },
          { label: "YouTube", to: "/actions" },
          { label: "Индексаторы", href: serviceUrl("prowlarr") || serviceUrl("qbittorrent") }
        ]
      },
      {
        title: "Файлы",
        description: "Медиа, музыка, книги, YouTube, заметки и документы.",
        icon: Folder,
        accent: "amber",
        services: ["File Browser"],
        actions: [
          { label: "Открыть файлы", to: "/files" },
          { label: "Книги", to: "/files" },
          { label: "Заметки", to: "/files" }
        ]
      },
      {
        title: "Автоматизация",
        description: "Сценарии, уведомления и быстрые команды.",
        icon: Bot,
        accent: "rose",
        services: ["n8n", "Telegram bot"],
        actions: [
          { label: "Открыть n8n", href: serviceUrl("n8n") },
          { label: "События", to: "/admin" }
        ]
      },
      {
        title: "Администрирование",
        description: "Состояние сервера, контейнеры, логи и обслуживание.",
        icon: ShieldCheck,
        accent: "slate",
        services: ["Мониторинг", "Docker", "Сервисы", "События", "Настройки"],
        actions: [
          { label: "Мониторинг", to: "/admin" },
          { label: "Админка", to: "/admin" }
        ]
      }
    ],
    [services]
  );

  return (
    <>
      <section className="home-hero home-server-hero">
        <div className="hero-copy">
          <p className="section-label">панель дома</p>
          <h1>Домашний сервер</h1>
          <p className="page-subtitle">Фильмы, музыка, загрузки, файлы и автоматизация в одном месте.</p>
          <div className="home-status-line" aria-label="Состояние сервера">
            <StatusBadge state={serviceStatusTone} label={serviceStatusText} />
            <span>{onlineServices || services.length} сервисов доступно</span>
          </div>
          <div className="hero-metrics" aria-label="Краткие метрики">
            <MetricPill label="CPU" value={summary?.server.cpu_percent != null ? `${summary.server.cpu_percent}%` : "—"} />
            <MetricPill label="RAM" value={summary?.server.memory_percent != null ? `${summary.server.memory_percent}%` : "—"} />
            <MetricPill label="Диск" value={summary?.server.disk_percent != null ? `${summary.server.disk_percent}%` : "—"} />
            <MetricPill label="Загрузки" value={activeTorrents.length} status={activeTorrents.length ? "success" : "neutral"} />
          </div>
          <div className="hero-actions">
            <Link className="primary-link-button" to="/actions">
              Скачать YouTube
            </Link>
            <Link className="secondary-button" to="/actions">
              Добавить magnet
            </Link>
            <Link className="secondary-button" to="/files">
              Открыть файлы
            </Link>
          </div>
        </div>
        <div className="hero-service-strip" aria-label="Быстрые сервисы">
          <HeroServiceLink title="Jellyfin" subtitle="Фильмы" href={serviceUrl("jellyfin")} target={serviceTarget} icon={Film} />
          <HeroServiceLink title="Navidrome" subtitle="Музыка" href={serviceUrl("navidrome")} target={serviceTarget} icon={Music} />
          <HeroServiceLink title="qBittorrent" subtitle="Торренты" href={serviceUrl("qbittorrent")} target={serviceTarget} icon={Download} />
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>Мои сервисы</h2>
          <span>по задачам</span>
        </div>
        <div className="service-story-grid">
          {serviceGroups.map((group) => (
            <ServiceGroupCard key={group.title} group={group} target={serviceTarget} />
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>Сейчас происходит</h2>
          <span>без таблиц</span>
        </div>
        <div className="activity-grid">
          <ActivityCard
            icon={Zap}
            title="Активные торренты"
            value={activeTorrents.length ? `${activeTorrents.length} в работе` : "нет активных"}
            detail={activeTorrents[0]?.name ?? "Очередь qBittorrent спокойна"}
            to="/downloads"
          />
          <ActivityCard
            icon={Download}
            title="Последние YouTube-загрузки"
            value={downloads.length ? `${downloads.length} файлов` : "пока пусто"}
            detail={downloads[0]?.name ?? "Новые ролики появятся здесь"}
            to="/actions"
          />
          <ActivityCard
            icon={Bell}
            title="События"
            value={events.length ? `${events.length} записей` : "нет событий"}
            detail={events[0]?.message ?? "Предупреждений сейчас нет"}
            to="/admin"
          />
          <ActivityCard
            icon={HardDrive}
            title="Свободное место"
            value={summary?.server.disk_percent != null ? `${100 - summary.server.disk_percent}% свободно` : "—"}
            detail={offlineServices > 0 ? `${offlineServices} сервисов требуют внимания` : "Сервисы выглядят доступными"}
            to="/admin"
          />
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>Быстрые действия</h2>
          <span>частые задачи</span>
        </div>
        <div className="quick-grid quick-grid-priority">
          <QuickActionCard title="Скачать YouTube" description="Видео или аудио через MeTube" icon={Link2} to="/actions" />
          <QuickActionCard title="Добавить magnet" description="Отправить в qBittorrent" icon={Download} to="/actions" />
          <QuickActionCard title="Загрузить файл" description="Открыть файловый раздел" icon={Upload} to="/files" />
          <QuickActionCard title="Открыть загрузки" description="Торренты и очередь" icon={Zap} to="/downloads" />
          <QuickActionCard title="Открыть админку" description="Мониторинг и обслуживание" icon={Settings} to="/admin" />
          <QuickActionCard title="Открыть книги" description="Раздел файлов" icon={BookOpen} to="/files" />
        </div>
      </section>
    </>
  );
}

function HeroServiceLink({
  title,
  subtitle,
  href,
  target,
  icon: Icon
}: {
  title: string;
  subtitle: string;
  href: string;
  target: ServiceTarget;
  icon: LucideIcon;
}) {
  return (
    <a className="hero-service-link" href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined}>
      <Icon size={20} aria-hidden="true" />
      <span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
    </a>
  );
}

function ServiceGroupCard({ group, target }: { group: ServiceGroup; target: ServiceTarget }) {
  const Icon = group.icon;
  return (
    <article className={`service-group-card service-group-${group.accent}`}>
      <div className="service-group-head">
        <span className="service-group-icon">
          <Icon size={24} aria-hidden="true" />
        </span>
        <div>
          <h3>{group.title}</h3>
          <p>{group.description}</p>
        </div>
      </div>
      <div className="service-chip-row">
        {group.services.map((service) => (
          <span key={service}>{service}</span>
        ))}
      </div>
      <div className="service-group-actions">
        {group.actions.map((action) =>
          action.to ? (
            <Link key={action.label} to={action.to}>
              {action.label}
            </Link>
          ) : (
            <a key={action.label} href={action.href} target={target} rel={target === "_blank" ? "noreferrer" : undefined}>
              {action.label}
            </a>
          )
        )}
      </div>
    </article>
  );
}

function ActivityCard({
  icon: Icon,
  title,
  value,
  detail,
  to
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  detail: string;
  to: string;
}) {
  return (
    <Link className="activity-card" to={to}>
      <span className="activity-icon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span>
        <small>{title}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </span>
    </Link>
  );
}
