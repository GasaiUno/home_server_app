type ConfirmDialogProps = {
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ title, text, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <p className="muted">{text}</p>
        <div className="dialog-actions">
          <button type="button" className="secondary-muted-button" onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
