export type ServiceItem = {
  id: string;
  name: string;
  url: string;
  description: string;
  icon: string;
  accent: string;
  category: string;
  health_url?: string | null;
};

export type StatusResponse = {
  status: string;
  app: string;
  version: string;
  uptime_seconds: number;
  server_time: string;
};

export type ServicesResponse = {
  services: ServiceItem[];
};

export type Notice = {
  type: "success" | "error";
  message: string;
};

export type ServiceTarget = "_self" | "_blank";

export type ServerMetrics = {
  cpu: {
    percent: number | null;
    load_avg: number[] | null;
    cores_logical: number | null;
    cores_physical: number | null;
  };
  memory: {
    total: number | null;
    used: number | null;
    available: number | null;
    percent: number | null;
  };
  swap: {
    total: number | null;
    used: number | null;
    percent: number | null;
  };
  disk: {
    root: DiskUsage;
    data: (DiskUsage & { path: string; available: boolean }) | null;
  };
  uptime: {
    server_uptime_seconds: number | null;
    backend_uptime_seconds: number;
    backend_started_at: string;
    server_time: string;
  };
  temperature: {
    cpu: number | null;
    available: boolean;
  };
};

export type DiskUsage = {
  total: number | null;
  used: number | null;
  free: number | null;
  percent: number | null;
};

export type DockerContainer = {
  name: string;
  status: string;
  image: string | null;
  created: string | null;
  started_at: string | null;
  restart_count: number | null;
  health: string | null;
};

export type ServiceHealthItem = {
  id: string;
  name: string;
  url: string;
  checked_url: string;
  online: boolean;
  status_code: number | null;
  response_time_ms: number | null;
};

export type AdminRegistryService = {
  key: string;
  display_name: string;
  container_name: string;
  url: string | null;
  category: string;
  allow_logs: boolean;
  allow_restart: boolean;
  allow_start: boolean;
  allow_stop: boolean;
  danger_level: "low" | "medium" | "high";
};

export type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
};

export type ServiceAction = "start" | "stop" | "restart";

export type ServiceActionResponse = {
  status: string;
  message: string;
  service: string;
  action: ServiceAction;
  task_id: string;
};

export type TaskHistoryItem = {
  id: string;
  action: string;
  service: string | null;
  status: string;
  message: string;
  created_at: string;
  finished_at: string | null;
  details: Record<string, unknown>;
};

export type AuditEventItem = {
  ts: string;
  action: string;
  service: string | null;
  result: string;
  details: Record<string, unknown>;
};

export type MediaOverviewService = {
  key: string;
  name: string;
  url: string | null;
  online: boolean;
  status: string | null;
};

export type JellyfinLibraryItem = {
  id: string;
  name: string;
  collection_type: string | null;
};

export type JellyfinMediaItem = {
  id: string;
  title: string;
  kind: string;
  year: number | null;
  overview: string | null;
  date_created: string | null;
  runtime_ticks: number | null;
  progress_percent: number | null;
  poster_url: string | null;
};

export type MusicAlbumItem = {
  id: string;
  title: string;
  artist: string | null;
  year: number | null;
  created: string | null;
  cover_url: string | null;
};

export type MusicArtistItem = {
  id: string;
  name: string;
  album_count: number | null;
};

export type EventItem = {
  id: string;
  level: string;
  type: string;
  message: string;
  created_at: string;
  sent_to_telegram: boolean;
};

export type TelegramStatus = {
  enabled: boolean;
  configured: boolean;
};

export type TorrentItem = {
  hash: string;
  name: string;
  state: string;
  progress: number;
  size: number;
  downloaded: number;
  uploaded: number;
  dlspeed: number;
  upspeed: number;
  eta: number;
  category: string | null;
  save_path: string | null;
};

export type FileItem = {
  name: string;
  type: "file" | "directory";
  path: string;
  size: number | null;
  modified_at: string;
  extension: string | null;
};

export type FilesListResponse = {
  current_path: string;
  parent_path: string;
  items: FileItem[];
  allow_delete: boolean;
};

export type YoutubeDownloadItem = {
  name: string;
  path: string;
  size: number;
  modified_at: string;
  extension: string;
};

export type DashboardSummary = {
  server: {
    online: boolean;
    disk_percent: number | null;
    memory_percent: number | null;
    cpu_percent: number | null;
  };
  torrents: {
    active: number;
    downloading: number;
    total_download_speed: number;
    total_upload_speed: number;
  };
  youtube: {
    recent_count: number;
  };
  services: {
    online: number;
    offline: number;
  };
};
