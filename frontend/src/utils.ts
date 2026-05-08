export function formatUptime(seconds: number): string {
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

export function formatBytes(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Недоступно";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let nextValue = value;
  let unitIndex = 0;
  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue = nextValue / 1024;
    unitIndex += 1;
  }
  return `${nextValue.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatSpeed(value: number | null | undefined): string {
  return `${formatBytes(value ?? 0)}/s`;
}

export function formatEta(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0 || seconds >= 8640000) {
    return "∞";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}м`;
}

export function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined ? "Недоступно" : `${value.toFixed(1)}%`;
}

export function healthTone(percent: number | null | undefined): "normal" | "warning" | "critical" {
  if (percent === null || percent === undefined) {
    return "normal";
  }
  if (percent >= 90) {
    return "critical";
  }
  if (percent >= 70) {
    return "warning";
  }
  return "normal";
}

export function formatServerTime(value?: string): string {
  if (!value) {
    return "unknown";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export function findServiceUrl(services: { id: string; url: string }[], id: string): string {
  return services.find((service) => service.id === id)?.url ?? "#";
}
