import {
  Activity,
  AudioLines,
  Bot,
  Clock3,
  Download,
  ExternalLink,
  File,
  Film,
  Gauge,
  Home,
  KeyRound,
  Link2,
  RefreshCw,
  Server,
  Workflow
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getServices, getStatus, sendMagnet, sendYoutube } from "./api";
import type { Notice, ServiceItem, StatusResponse } from "./types";

const TOKEN_KEY = "home-server-token";

const iconByName: Record<string, typeof Film> = {
  Jellyfin: Film,
  Navidrome: AudioLines,
  "File Browser": File,
  qBittorrent: Download,
  MeTube: Link2,
  n8n: Workflow,
  Homepage: Home
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [draftToken, setDraftToken] = useState("");
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [magnetUrl, setMagnetUrl] = useState("");
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [magnetLoading, setMagnetLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const [statusPayload, servicesPayload] = await Promise.all([getStatus(token), getServices(token)]);
      setStatus(statusPayload);
      setServices(servicesPayload.services);
    } catch (error) {
      setStatus(null);
      setServices([]);
      setNotice({ type: "error", message: `Backend недоступен или token неверный: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const serverTime = useMemo(() => {
    if (!status?.server_time) {
      return "unknown";
    }
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "medium"
    }).format(new Date(status.server_time));
  }, [status?.server_time]);

  function saveToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextToken = draftToken.trim();
    if (!nextToken) {
      setNotice({ type: "error", message: "Введите access token" });
      return;
    }
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setDraftToken("");
  }

  function changeToken() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setStatus(null);
    setServices([]);
    setNotice(null);
  }

  async function handleYoutube(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setYoutubeLoading(true);
    setNotice(null);
    try {
      await sendYoutube(token, {
        url: youtubeUrl.trim(),
        quality: "best",
        download_type: "video",
        format: "any"
      });
      setYoutubeUrl("");
      setNotice({ type: "success", message: "YouTube ссылка отправлена в MeTube" });
    } catch (error) {
      setNotice({ type: "error", message: `Не удалось отправить YouTube ссылку: ${getErrorMessage(error)}` });
    } finally {
      setYoutubeLoading(false);
    }
  }

  async function handleMagnet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMagnetLoading(true);
    setNotice(null);
    try {
      await sendMagnet(token, { url: magnetUrl.trim() });
      setMagnetUrl("");
      setNotice({ type: "success", message: "Magnet добавлен в qBittorrent" });
    } catch (error) {
      setNotice({ type: "error", message: `Не удалось добавить magnet: ${getErrorMessage(error)}` });
    } finally {
      setMagnetLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <div className="brand-mark">
            <Server size={30} aria-hidden="true" />
          </div>
          <h1>Home Server</h1>
          <p>Введите access token для подключения к панели.</p>
          <form onSubmit={saveToken} className="auth-form">
            <label htmlFor="token">Access token</label>
            <div className="input-row">
              <KeyRound size={18} aria-hidden="true" />
              <input
                id="token"
                type="password"
                value={draftToken}
                onChange={(event) => setDraftToken(event.target.value)}
                placeholder="HOME_APP_TOKEN"
                autoComplete="current-password"
              />
            </div>
            <button type="submit">Войти</button>
          </form>
          {notice ? <p className={`notice ${notice.type}`}>{notice.message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="section-label">VPN 10.8.1.5</p>
          <h1>Home Server</h1>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={loadDashboard} aria-label="Обновить">
            <RefreshCw size={18} aria-hidden="true" />
          </button>
          <button className="secondary-button" type="button" onClick={changeToken}>
            Сменить token
          </button>
        </div>
      </header>

      {notice ? <div className={`notice ${notice.type}`}>{notice.message}</div> : null}

      <section className="status-grid" aria-label="Статус сервера">
        <StatusTile icon={Activity} label="Backend" value={status?.status ?? (loading ? "loading" : "unknown")} />
        <StatusTile icon={Gauge} label="Uptime" value={status ? formatUptime(status.uptime_seconds) : "unknown"} />
        <StatusTile icon={Server} label="Version" value={status?.version ?? "0.1.0"} />
        <StatusTile icon={Clock3} label="Server time" value={serverTime} />
      </section>

      <section className="content-grid">
        <section className="panel services-panel">
          <div className="panel-header">
            <h2>Сервисы</h2>
            <span>{services.length || "..."}</span>
          </div>
          {loading ? <p className="muted">Загрузка сервисов...</p> : null}
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>
        </section>

        <section className="forms-column">
          <form className="panel action-form" onSubmit={handleYoutube}>
            <h2>Скачать YouTube</h2>
            <label htmlFor="youtube-url">URL</label>
            <input
              id="youtube-url"
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://youtube.com/..."
              inputMode="url"
            />
            <button type="submit" disabled={youtubeLoading || !youtubeUrl.trim()}>
              {youtubeLoading ? "Отправка..." : "Отправить в MeTube"}
            </button>
          </form>

          <form className="panel action-form" onSubmit={handleMagnet}>
            <h2>Добавить magnet</h2>
            <label htmlFor="magnet-url">Magnet URL</label>
            <input
              id="magnet-url"
              value={magnetUrl}
              onChange={(event) => setMagnetUrl(event.target.value)}
              placeholder="magnet:?xt=urn:btih:..."
            />
            <button type="submit" disabled={magnetLoading || !magnetUrl.trim()}>
              {magnetLoading ? "Добавление..." : "Добавить в qBittorrent"}
            </button>
          </form>
        </section>
      </section>
    </main>
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

function ServiceCard({ service }: { service: ServiceItem }) {
  const Icon = iconByName[service.name] ?? Server;

  return (
    <a className="service-card" href={service.url} target="_blank" rel="noreferrer">
      <span className="service-icon">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span>
        <strong>{service.name}</strong>
        <small>{service.description}</small>
      </span>
      <ExternalLink size={17} aria-hidden="true" />
    </a>
  );
}
