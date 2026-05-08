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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await addTorrentMagnet(token, { url: url.trim(), category: category.trim() || undefined });
      setUrl("");
      onNotice({ type: "success", message: "Magnet добавлен в qBittorrent" });
      onAdded?.();
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось добавить magnet: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel action-form" onSubmit={submit}>
      <h2>Добавить magnet</h2>
      <label htmlFor="magnet-url">Magnet URL</label>
      <input id="magnet-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="magnet:?xt=urn:btih:..." />
      <label htmlFor="magnet-category">Категория</label>
      <input id="magnet-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="telegram" />
      <button type="submit" disabled={loading || !url.trim()}>
        {loading ? "Добавление..." : "Добавить в qBittorrent"}
      </button>
    </form>
  );
}
