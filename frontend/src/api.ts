import type {
  AdminRegistryService,
  ApiEnvelope,
  DockerContainer,
  EventItem,
  DashboardSummary,
  FileItem,
  FilesListResponse,
  ServerMetrics,
  ServiceHealthItem,
  ServicesResponse,
  StatusResponse,
  TelegramStatus,
  TorrentItem,
  YoutubeDownloadItem
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
    throw new Error(text || `Запрос завершился ошибкой ${response.status}`);
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

export function getDashboardSummary(token: string): Promise<DashboardSummary> {
  return request<DashboardSummary>("/api/dashboard/summary", token);
}

export function getTorrents(token: string): Promise<{ items: TorrentItem[] }> {
  return request<{ items: TorrentItem[] }>("/api/torrents", token);
}

export function addTorrentMagnet(token: string, body: { url: string; category?: string }): Promise<{ status: string; message: string }> {
  return request("/api/torrents/add-magnet", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function uploadTorrentFile(token: string, file: File, category: string): Promise<{ status: string; message: string }> {
  const form = new FormData();
  form.append("file", file);
  if (category.trim()) {
    form.append("category", category.trim());
  }
  return uploadRequest("/api/torrents/upload", token, form);
}

export function pauseTorrent(token: string, hash: string): Promise<{ status: string; message: string }> {
  return request(`/api/torrents/${hash}/pause`, token, { method: "POST" });
}

export function resumeTorrent(token: string, hash: string): Promise<{ status: string; message: string }> {
  return request(`/api/torrents/${hash}/resume`, token, { method: "POST" });
}

export function deleteTorrent(token: string, hash: string, deleteFiles: boolean): Promise<{ status: string; message: string }> {
  return request(`/api/torrents/${hash}?delete_files=${deleteFiles ? "true" : "false"}`, token, { method: "DELETE" });
}

export function getYoutubeDownloads(token: string): Promise<{ items: YoutubeDownloadItem[] }> {
  return request<{ items: YoutubeDownloadItem[] }>("/api/youtube/downloads", token);
}

export function getFiles(token: string, path: string): Promise<FilesListResponse> {
  return request<FilesListResponse>(`/api/files?path=${encodeURIComponent(path)}`, token);
}

export function createFolder(token: string, path: string): Promise<{ status: string; message: string }> {
  return request("/api/files/mkdir", token, {
    method: "POST",
    body: JSON.stringify({ path })
  });
}

export function uploadFile(token: string, path: string, file: File): Promise<FileItem> {
  const form = new FormData();
  form.append("path", path);
  form.append("file", file);
  return uploadRequest("/api/files/upload", token, form);
}

export function deleteFilePath(token: string, path: string): Promise<{ status: string; message: string }> {
  return request("/api/files", token, {
    method: "DELETE",
    body: JSON.stringify({ path })
  });
}

export function fileDownloadUrl(path: string): string {
  return `/api/files/download?path=${encodeURIComponent(path)}`;
}

export async function downloadFile(token: string, path: string): Promise<Blob> {
  const response = await fetch(fileDownloadUrl(path), {
    headers: { "X-Home-Token": token }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Запрос завершился ошибкой ${response.status}`);
  }
  return response.blob();
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

export async function getAdminServicesRegistry(token: string): Promise<{ services: AdminRegistryService[] }> {
  const response = await request<ApiEnvelope<{ services: AdminRegistryService[] }>>("/api/admin/services-registry", token);
  return response.data;
}

export async function getAdminServiceLogs(token: string, name: string, tail = 200): Promise<{ service: string; tail: number; logs: string[] }> {
  const response = await request<ApiEnvelope<{ service: string; tail: number; logs: string[] }>>(
    `/api/admin/services-registry/${encodeURIComponent(name)}/logs?tail=${tail}`,
    token
  );
  return response.data;
}

export function getAdminEvents(token: string): Promise<{ events: EventItem[]; telegram: TelegramStatus }> {
  return request<{ events: EventItem[]; telegram: TelegramStatus }>("/api/admin/events", token);
}

export function sendTestTelegramAlert(token: string): Promise<{ status: string; message: string; telegram: TelegramStatus }> {
  return request("/api/admin/alerts/test", token, { method: "POST" });
}

async function uploadRequest<T>(path: string, token: string, body: FormData): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "X-Home-Token": token },
    body
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Запрос завершился ошибкой ${response.status}`);
  }
  return response.json() as Promise<T>;
}
