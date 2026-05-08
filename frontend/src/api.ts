import type {
  DockerContainer,
  EventItem,
  ServerMetrics,
  ServiceHealthItem,
  ServicesResponse,
  StatusResponse,
  TelegramStatus
} from "./types";

type JsonBody = Record<string, string>;

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Home-Token": token,
      ...options.headers
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getStatus(token: string): Promise<StatusResponse> {
  return request<StatusResponse>("/api/status", token);
}

export function getServices(token: string): Promise<ServicesResponse> {
  return request<ServicesResponse>("/api/services", token);
}

export function sendYoutube(token: string, body: JsonBody): Promise<{ status: string; message: string }> {
  return request("/api/youtube", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function sendMagnet(token: string, body: JsonBody): Promise<{ status: string; message: string }> {
  return request("/api/magnet", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function getAdminMetrics(token: string): Promise<ServerMetrics> {
  return request<ServerMetrics>("/api/admin/metrics", token);
}

export function getAdminDocker(token: string): Promise<{ containers: DockerContainer[] }> {
  return request<{ containers: DockerContainer[] }>("/api/admin/docker", token);
}

export function getAdminServicesHealth(token: string): Promise<{ services: ServiceHealthItem[] }> {
  return request<{ services: ServiceHealthItem[] }>("/api/admin/services-health", token);
}

export function getAdminEvents(token: string): Promise<{ events: EventItem[]; telegram: TelegramStatus }> {
  return request<{ events: EventItem[]; telegram: TelegramStatus }>("/api/admin/events", token);
}

export function sendTestTelegramAlert(token: string): Promise<{ status: string; message: string; telegram: TelegramStatus }> {
  return request("/api/admin/alerts/test", token, { method: "POST" });
}
