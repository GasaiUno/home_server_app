import { useState } from "react";
import { uploadTorrentFile } from "../api";
import type { Notice } from "../types";
import { getErrorMessage } from "../utils";

type TorrentUploadDropzoneProps = {
  token: string;
  onNotice: (notice: Notice) => void;
  onUploaded?: () => void;
};

export function TorrentUploadDropzone({ token, onNotice, onUploaded }: TorrentUploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upload() {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      await uploadTorrentFile(token, file, category);
      setFile(null);
      onNotice({ type: "success", message: ".torrent файл отправлен" });
      onUploaded?.();
    } catch (error) {
      const message = `Не удалось загрузить .torrent: ${getErrorMessage(error)}`;
      setError(message);
      onNotice({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel action-form">
      <div className="form-title-row">
        <h2>.torrent upload</h2>
        <span>file</span>
      </div>
      <p className="muted">Файл отправляется в qBittorrent без изменения текущего API.</p>
      <label className="dropzone">
        <input type="file" accept=".torrent" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <span>{file ? file.name : "Выберите .torrent файл"}</span>
      </label>
      <label htmlFor="torrent-category">Категория</label>
      <input id="torrent-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="telegram" />
      {error ? <p className="inline-error">{error}</p> : null}
      <button type="button" onClick={upload} disabled={loading || !file}>
        {loading ? "Загрузка..." : "Отправить torrent"}
      </button>
    </section>
  );
}
