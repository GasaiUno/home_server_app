import { Send } from "lucide-react";

type TestTelegramAlertButtonProps = {
  loading: boolean;
  onClick: () => void;
};

export function TestTelegramAlertButton({ loading, onClick }: TestTelegramAlertButtonProps) {
  return (
    <button className="secondary-button test-alert-button" type="button" onClick={onClick} disabled={loading}>
      <Send size={17} aria-hidden="true" />
      {loading ? "Отправка..." : "Тест Telegram"}
    </button>
  );
}
