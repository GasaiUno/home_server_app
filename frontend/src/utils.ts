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
