import { AddMagnetForm } from "../components/AddMagnetForm";
import { AddYoutubeForm } from "../components/AddYoutubeForm";
import { TorrentUploadDropzone } from "../components/TorrentUploadDropzone";
import type { Notice } from "../types";

type ActionsPageProps = {
  token: string;
  onNotice: (notice: Notice) => void;
};

export function ActionsPage({ token, onNotice }: ActionsPageProps) {
  return (
    <div className="actions-command-screen">
      <section className="actions-command-intro">
        <div>
          <h1>Добавить загрузку</h1>
          <p>Отправьте YouTube-ссылку, magnet или .torrent файл в домашнюю очередь без лишних технических экранов.</p>
        </div>
        <div className="command-mini-stack" aria-label="Типы загрузок">
          <span>YouTube</span>
          <span>magnet</span>
          <span>.torrent</span>
        </div>
      </section>
      <section className="forms-layout actions-v2">
        <AddYoutubeForm token={token} onNotice={onNotice} />
        <AddMagnetForm token={token} onNotice={onNotice} />
        <TorrentUploadDropzone token={token} onNotice={onNotice} />
      </section>
    </div>
  );
}
