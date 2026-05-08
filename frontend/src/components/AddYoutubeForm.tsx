import { FormEvent, useState } from "react";
import { sendYoutube } from "../api";
import type { Notice } from "../types";
import { getErrorMessage } from "../utils";

type AddYoutubeFormProps = {
  token: string;
  onNotice: (notice: Notice) => void;
  onAdded?: () => void;
};

export function AddYoutubeForm({ token, onNotice, onAdded }: AddYoutubeFormProps) {
  const [url, setUrl] = useState("");
  const [downloadType, setDownloadType] = useState<"video" | "audio">("video");
  const [quality, setQuality] = useState("best");
  const [format, setFormat] = useState("any");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await sendYoutube(token, {
        url: url.trim(),
        download_type: downloadType,
        quality,
        format: downloadType === "audio" && format === "any" ? "mp3" : format
      });
      setUrl("");
      onNotice({ type: "success", message: "YouTube ссылка отправлена на загрузку" });
      onAdded?.();
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось отправить YouTube ссылку: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel action-form" onSubmit={submit}>
      <h2>Скачать YouTube</h2>
      <label htmlFor="youtube-url">URL</label>
      <input id="youtube-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtube.com/..." inputMode="url" />
      <div className="form-row">
        <label>
          Тип
          <select value={downloadType} onChange={(event) => setDownloadType(event.target.value as "video" | "audio")}>
            <option value="video">Видео</option>
            <option value="audio">Аудио</option>
          </select>
        </label>
        <label>
          Качество
          <select value={quality} onChange={(event) => setQuality(event.target.value)}>
            <option value="best">best</option>
            <option value="1080">1080</option>
            <option value="720">720</option>
            <option value="480">480</option>
          </select>
        </label>
        <label>
          Формат
          <select value={format} onChange={(event) => setFormat(event.target.value)}>
            <option value="any">any</option>
            <option value="mp4">mp4</option>
            <option value="mp3">mp3</option>
          </select>
        </label>
      </div>
      <button type="submit" disabled={loading || !url.trim()}>
        {loading ? "Отправка..." : "Отправить в MeTube"}
      </button>
    </form>
  );
}
