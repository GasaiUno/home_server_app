import { Activity, Bell, Download, Film, Folder, HardDrive, Link2, Server, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboardSummary, getTorrents, getYoutubeDownloads } from "../api";
import { ActiveTorrentsWidget } from "../components/ActiveTorrentsWidget";
import { DashboardSummaryCard } from "../components/DashboardSummaryCard";
import { DiskUsageMiniWidget } from "../components/DiskUsageMiniWidget";
import { QuickActionCard } from "../components/QuickActionCard";
import { RecentDownloadsWidget } from "../components/RecentDownloadsWidget";
import { ServiceCard } from "../components/ServiceCard";
import { StatusBadge } from "../components/StatusBadge";
import { BentoCard, MetricPill } from "../components/Surface";
import type { DashboardSummary, ServiceItem, ServiceTarget, StatusResponse, TorrentItem, YoutubeDownloadItem } from "../types";
import { formatSpeed, findServiceUrl } from "../utils";

type HomePageProps = {
  token: string;
  services: ServiceItem[];
  status: StatusResponse | null;
  loading: boolean;
  serviceTarget: ServiceTarget;
};

export function HomePage({ token, services, status, loading, serviceTarget }: HomePageProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [torrents, setTorrents] = useState<TorrentItem[]>([]);
  const [downloads, setDownloads] = useState<YoutubeDownloadItem[]>([]);

  useEffect(() => {
    void Promise.allSettled([getDashboardSummary(token), getTorrents(token), getYoutubeDownloads(token)]).then((results) => {
      if (results[0].status === "fulfilled") setSummary(results[0].value);
      if (results[1].status === "fulfilled") setTorrents(results[1].value.items);
      if (results[2].status === "fulfilled") setDownloads(results[2].value.items);
    });
  }, [token]);

  const primaryServices = services.filter((service) =>
    ["jellyfin", "navidrome", "file-browser", "qbittorrent", "metube", "n8n"].includes(service.id)
  );
  const serverCard: ServiceItem = {
    id: "server",
    name: "Сервер",
        description: "Статус, мониторинг и управление",
    url: "/admin",
    icon: "server",
    accent: "slate",
    category: "system"
  };
  const activeTorrents = torrents.filter((torrent) => torrent.dlspeed > 0 || torrent.upspeed > 0);
  const totalDownloadSpeed = torrents.reduce((total, torrent) => total + torrent.dlspeed, 0);
  const totalUploadSpeed = torrents.reduce((total, torrent) => total + torrent.upspeed, 0);
  const completedTorrents = torrents.filter((torrent) => torrent.progress >= 1).length;
  const onlineServices = summary?.services.online ?? 0;
  const offlineServices = summary?.services.offline ?? 0;

  return (
    <>
      <section className="home-hero control-hero">
        <div className="hero-copy">
          <p className="section-label">Control Center</p>
          <h1>Home Server</h1>
          <p className="page-subtitle">Статус, медиа, файлы и загрузки в одном домашнем центре.</p>
          <div className="hero-metrics" aria-label="Краткие метрики">
            <MetricPill label="CPU" value={summary?.server.cpu_percent != null ? `${summary.server.cpu_percent}%` : "—"} />
            <MetricPill label="RAM" value={summary?.server.memory_percent != null ? `${summary.server.memory_percent}%` : "—"} />
            <MetricPill label="Disk" value={summary?.server.disk_percent != null ? `${summary.server.disk_percent}%` : "—"} />
            <MetricPill label="Active" value={activeTorrents.length} status={activeTorrents.length ? "success" : "neutral"} />
          </div>
        </div>
        <div className="hero-status-stack">
          <StatusBadge status={status} loading={loading} />
          <QuickActionCard title="Открыть мониторинг" description="CPU, RAM, Docker, alerts" icon={Activity} to="/admin" />
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>Быстрые действия</h2>
          <span>частые сценарии</span>
        </div>
        <div className="quick-grid quick-grid-priority">
          <QuickActionCard title="YouTube Download" description="Видео или аудио в MeTube" icon={Link2} to="/actions" />
          <QuickActionCard title="Add Magnet" description="Передать в qBittorrent" icon={Download} to="/actions" />
          <QuickActionCard title="Files" description="Открыть браузер файлов" icon={Folder} to="/files" />
          <QuickActionCard title="Downloads" description="Торренты и очереди" icon={Zap} to="/downloads" />
          <QuickActionCard title="Admin" description="Мониторинг и foundation" icon={ShieldCheck} to="/admin" />
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>Live overview</h2>
          <span>сейчас</span>
        </div>
        <div className="bento-grid">
          <BentoCard
            icon={Download}
            title="Downloads"
            description="Активные торренты и текущая скорость"
            metric={
              <div className="metric-cluster">
                <MetricPill label="active" value={activeTorrents.length} status={activeTorrents.length ? "success" : "neutral"} />
                <MetricPill label="down" value={formatSpeed(totalDownloadSpeed)} />
                <MetricPill label="up" value={formatSpeed(totalUploadSpeed)} />
              </div>
            }
          />
          <BentoCard
            icon={HardDrive}
            title="Storage"
            description="Заполненность основного диска"
            metric={<MetricPill label="disk" value={summary?.server.disk_percent != null ? `${summary.server.disk_percent}%` : "—"} />}
          />
          <BentoCard
            icon={Server}
            title="Services"
            description="Health summary"
            metric={
              <div className="metric-cluster">
                <MetricPill label="online" value={onlineServices} status="success" />
                <MetricPill label="offline" value={offlineServices} status={offlineServices ? "danger" : "neutral"} />
              </div>
            }
          />
          <BentoCard
            icon={Bell}
            title="Recent"
            description="YouTube downloads and completed torrents"
            metric={
              <div className="metric-cluster">
                <MetricPill label="youtube" value={downloads.length} />
                <MetricPill label="done" value={completedTorrents} />
              </div>
            }
          />
        </div>
      </section>

      <DashboardSummaryCard summary={summary} />

      <section className="home-widgets">
        <ActiveTorrentsWidget torrents={activeTorrents} />
        <RecentDownloadsWidget items={downloads} />
        <DiskUsageMiniWidget summary={summary} />
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>Service shortcuts</h2>
          <span>{services.length ? `${services.length} подключено` : "загрузка"}</span>
        </div>
        <div className="home-services-grid">
          {primaryServices.map((service) => (
            <ServiceCard key={service.id} service={service} target={serviceTarget} />
          ))}
          <QuickActionCard title="Открыть файлы" description="File Browser" icon={Folder} href={findServiceUrl(services, "file-browser")} />
          <QuickActionCard title="Открыть торренты" description="qBittorrent" icon={Download} href={findServiceUrl(services, "qbittorrent")} />
          <QuickActionCard title="Открыть фильмы" description="Jellyfin" icon={Film} href={findServiceUrl(services, "jellyfin")} />
          <ServiceCard service={serverCard} target="_self" toAdmin />
        </div>
      </section>
    </>
  );
}
