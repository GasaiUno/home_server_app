import { Activity, Clock3, Server } from "lucide-react";
import type { StatusResponse } from "../types";
import { formatServerTime } from "../utils";

type StatusBadgeProps = {
  status: StatusResponse | null;
  loading: boolean;
};

export function StatusBadge({ status, loading }: StatusBadgeProps) {
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
        <span>Версия: {status?.version ?? "0.1.2"}</span>
      </div>
    </section>
  );
}
