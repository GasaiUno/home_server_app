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
