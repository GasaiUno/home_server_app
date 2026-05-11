import { KeyRound, Server } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import type { ServiceTarget, StatusResponse } from "../types";
import { formatServerTime } from "../utils";

type SettingsPageProps = {
  status: StatusResponse | null;
  serviceTarget: ServiceTarget;
  onTargetChange: (target: ServiceTarget) => void;
  onChangeToken: () => void;
};

export function SettingsPage({ status, serviceTarget, onTargetChange, onChangeToken }: SettingsPageProps) {
  return (
    <>
      <PageHeader kicker="Настройки" title="Settings" subtitle="Token, backend и поведение открытия сервисов." />
      <section className="settings-grid">
        <article className="panel settings-card">
          <KeyRound size={24} aria-hidden="true" />
          <h2>Access token</h2>
          <p className="muted">Token хранится только в localStorage браузера и отправляется как X-Home-Token.</p>
          <button className="secondary-button" type="button" onClick={onChangeToken}>
            Сменить token
          </button>
        </article>

        <article className="panel settings-card">
          <Server size={24} aria-hidden="true" />
          <h2>Backend</h2>
          <dl className="settings-list">
            <div>
              <dt>Статус</dt>
              <dd>{status?.status ?? "unknown"}</dd>
            </div>
            <div>
              <dt>Версия</dt>
              <dd>{status?.version ?? "0.2.3"}</dd>
            </div>
            <div>
              <dt>Время</dt>
              <dd>{formatServerTime(status?.server_time)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel settings-card">
          <h2>Открытие сервисов</h2>
          <p className="muted">Для PWA удобнее открывать внутренние VPN-сервисы в текущем окне.</p>
          <div className="segmented-control">
            <button
              type="button"
              className={serviceTarget === "_self" ? "active" : ""}
              onClick={() => onTargetChange("_self")}
            >
              В этом окне
            </button>
            <button
              type="button"
              className={serviceTarget === "_blank" ? "active" : ""}
              onClick={() => onTargetChange("_blank")}
            >
              Новая вкладка
            </button>
          </div>
        </article>
      </section>
    </>
  );
}
