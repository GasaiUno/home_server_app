import { FormEvent, useState } from "react";
import { addTorrentMagnet } from "../api";
import type { Notice } from "../types";
import { getErrorMessage } from "../utils";

type AddMagnetFormProps = {
  token: string;
  onNotice: (notice: Notice) => void;
  onAdded?: () => void;
};

export function AddMagnetForm({ token, onNotice, onAdded }: AddMagnetFormProps) {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addTorrentMagnet(token, { url: url.trim(), category: category.trim() || undefined });
      setUrl("");
      onNotice({ type: "success", message: "Magnet добавлен в qBittorrent" });
      onAdded?.();
    } catch (error) {
      const message = `Не удалось добавить magnet: ${getErrorMessage(error)}`;
      setError(message);
      onNotice({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel action-form action-card-primary command-form command-magnet" onSubmit={submit}>
      <div className="form-title-row">
        <h2>Добавить magnet</h2>
        <span>qBittorrent</span>
      </div>
      <p className="muted">Magnet-ссылка уйдёт в qBittorrent. Категория необязательна.</p>
      <label htmlFor="magnet-url">Magnet-ссылка</label>
      <input id="magnet-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="magnet:?xt=urn:btih:..." />
      <label htmlFor="magnet-category">Категория</label>
      <input id="magnet-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="telegram" />
      {error ? <p className="inline-error">{error}</p> : null}
      <button type="submit" disabled={loading || !url.trim()}>
        {loading ? "Добавление..." : "Добавить торрент"}
      </button>
    </form>
  );
}
