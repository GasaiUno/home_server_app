import { FormEvent, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { sendMagnet, sendYoutube } from "../api";
import type { Notice } from "../types";
import { getErrorMessage } from "../utils";

type ActionsPageProps = {
  token: string;
  onNotice: (notice: Notice) => void;
};

export function ActionsPage({ token, onNotice }: ActionsPageProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [magnetUrl, setMagnetUrl] = useState("");
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [magnetLoading, setMagnetLoading] = useState(false);

  async function handleYoutube(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setYoutubeLoading(true);
    try {
      await sendYoutube(token, {
        url: youtubeUrl.trim(),
        quality: "best",
        download_type: "video",
        format: "any"
      });
      setYoutubeUrl("");
      onNotice({ type: "success", message: "YouTube ссылка отправлена в MeTube" });
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось отправить YouTube ссылку: ${getErrorMessage(error)}` });
    } finally {
      setYoutubeLoading(false);
    }
  }

  async function handleMagnet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMagnetLoading(true);
    try {
      await sendMagnet(token, { url: magnetUrl.trim() });
      setMagnetUrl("");
      onNotice({ type: "success", message: "Magnet добавлен в qBittorrent" });
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось добавить magnet: ${getErrorMessage(error)}` });
    } finally {
      setMagnetLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Быстрые действия"
        title="Actions"
        subtitle="Отправка ссылок в существующие n8n webhook без лишней навигации."
      />
      <section className="forms-layout">
        <form className="panel action-form" onSubmit={handleYoutube}>
          <h2>Скачать YouTube</h2>
          <label htmlFor="youtube-url">URL</label>
          <input
            id="youtube-url"
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://youtube.com/..."
            inputMode="url"
          />
          <button type="submit" disabled={youtubeLoading || !youtubeUrl.trim()}>
            {youtubeLoading ? "Отправка..." : "Отправить в MeTube"}
          </button>
        </form>

        <form className="panel action-form" onSubmit={handleMagnet}>
          <h2>Добавить magnet</h2>
          <label htmlFor="magnet-url">Magnet URL</label>
          <input
            id="magnet-url"
            value={magnetUrl}
            onChange={(event) => setMagnetUrl(event.target.value)}
            placeholder="magnet:?xt=urn:btih:..."
          />
          <button type="submit" disabled={magnetLoading || !magnetUrl.trim()}>
            {magnetLoading ? "Добавление..." : "Добавить в qBittorrent"}
          </button>
        </form>
      </section>
    </>
  );
}
