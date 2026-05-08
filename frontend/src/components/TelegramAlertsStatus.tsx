import { Send } from "lucide-react";
import type { TelegramStatus } from "../types";

type TelegramAlertsStatusProps = {
  telegram: TelegramStatus | null;
};

export function TelegramAlertsStatus({ telegram }: TelegramAlertsStatusProps) {
  return (
    <section className="panel telegram-panel">
      <span className="metric-icon">
        <Send size={21} aria-hidden="true" />
      </span>
      <div>
        <h2>Telegram alerts</h2>
        <p className="muted">
          {telegram?.configured
            ? telegram.enabled
              ? "Уведомления включены и настроены."
              : "Telegram настроен, но alerts отключены."
            : "Telegram alerts не настроены. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_ADMIN_ID."}
        </p>
      </div>
    </section>
  );
}
