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

  async function upload() {
    if (!file) return;
    setLoading(true);
    try {
      await uploadTorrentFile(token, file, category);
      setFile(null);
      onNotice({ type: "success", message: ".torrent файл отправлен" });
      onUploaded?.();
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось загрузить .torrent: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel action-form">
      <h2>Загрузить .torrent</h2>
      <label className="dropzone">
        <input type="file" accept=".torrent" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <span>{file ? file.name : "Выберите .torrent файл"}</span>
      </label>
      <label htmlFor="torrent-category">Категория</label>
      <input id="torrent-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="telegram" />
      <button type="button" onClick={upload} disabled={loading || !file}>
        {loading ? "Загрузка..." : "Отправить torrent"}
      </button>
    </section>
  );
}
