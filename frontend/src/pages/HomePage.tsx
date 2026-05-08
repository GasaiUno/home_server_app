import { Activity, Download, Film, Folder, Link2 } from "lucide-react";
import { QuickActionCard } from "../components/QuickActionCard";
import { ServiceCard } from "../components/ServiceCard";
import { StatusBadge } from "../components/StatusBadge";
import type { ServiceItem, ServiceTarget, StatusResponse } from "../types";
import { findServiceUrl } from "../utils";

type HomePageProps = {
  services: ServiceItem[];
  status: StatusResponse | null;
  loading: boolean;
  serviceTarget: ServiceTarget;
};

export function HomePage({ services, status, loading, serviceTarget }: HomePageProps) {
  const primaryServices = services.filter((service) =>
    ["jellyfin", "navidrome", "file-browser", "qbittorrent", "metube", "n8n"].includes(service.id)
  );
  const serverCard: ServiceItem = {
    id: "server",
    name: "Сервер",
    description: "Статус, ресурсы и управление",
    url: "/admin",
    icon: "server",
    accent: "slate",
    category: "system"
  };

  return (
    <>
      <section className="home-hero">
        <div>
          <p className="section-label">Home Mode</p>
          <h1>Home Server</h1>
          <p className="page-subtitle">Личный медиацентр, облако и панель управления</p>
        </div>
        <StatusBadge status={status} loading={loading} />
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>Сервисы</h2>
          <span>{services.length ? `${services.length} подключено` : "загрузка"}</span>
        </div>
        <div className="home-services-grid">
          {primaryServices.map((service) => (
            <ServiceCard key={service.id} service={service} target={serviceTarget} />
          ))}
          <ServiceCard service={serverCard} target="_self" toAdmin />
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <h2>Быстрые действия</h2>
          <span>частые сценарии</span>
        </div>
        <div className="quick-grid">
          <QuickActionCard title="Скачать YouTube" description="Отправить ссылку в MeTube" icon={Link2} to="/actions" />
          <QuickActionCard title="Добавить magnet" description="Передать magnet в qBittorrent" icon={Download} to="/actions" />
          <QuickActionCard title="Открыть файлы" description="File Browser" icon={Folder} href={findServiceUrl(services, "file-browser")} />
          <QuickActionCard title="Открыть фильмы" description="Jellyfin" icon={Film} href={findServiceUrl(services, "jellyfin")} />
          <QuickActionCard title="Админка" description="Статус и технические действия" icon={Activity} to="/admin" />
        </div>
      </section>
    </>
  );
}
