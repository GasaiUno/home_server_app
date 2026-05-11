import { Activity, Clock3, Server } from "lucide-react";
import type { StatusResponse } from "../types";
import { formatServerTime } from "../utils";

type StatusBadgeProps = {
  status?: StatusResponse | null;
  loading?: boolean;
  state?: "online" | "offline" | "warning" | "danger" | "neutral" | "running" | "stopped" | "unknown";
  label?: string;
};

export function StatusBadge({ status, loading, state, label }: StatusBadgeProps) {
  if (state) {
    return <span className={`status-pill status-${state}`}>{label ?? state}</span>;
  }

  return (
    <section className="home-status" aria-label="Статус сервера">
      <div className="online-pill">
        <Activity size={17} aria-hidden="true" />
        <span>{status?.status === "ok" ? "Сервер онлайн" : loading ? "Проверка сервера" : "Сервер недоступен"}</span>
      </div>
      <div>
        <Clock3 size={17} aria-hidden="true" />
        <span>Время: {formatServerTime(status?.server_time)}</span>
      </div>
      <div>
        <Server size={17} aria-hidden="true" />
        <span>Версия: {status?.version ?? "0.2.3"}</span>
      </div>
    </section>
  );
}
