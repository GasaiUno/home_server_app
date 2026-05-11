import { AddMagnetForm } from "../components/AddMagnetForm";
import { AddYoutubeForm } from "../components/AddYoutubeForm";
import { PageHeader } from "../components/PageHeader";
import { TorrentUploadDropzone } from "../components/TorrentUploadDropzone";
import type { Notice } from "../types";

type ActionsPageProps = {
  token: string;
  onNotice: (notice: Notice) => void;
};

export function ActionsPage({ token, onNotice }: ActionsPageProps) {
  return (
    <>
      <PageHeader
        kicker="Control actions"
        title="Действия"
        subtitle="Две основные точки входа: YouTube download и torrent flow."
      />
      <section className="forms-layout actions-v2">
        <AddYoutubeForm token={token} onNotice={onNotice} />
        <AddMagnetForm token={token} onNotice={onNotice} />
        <TorrentUploadDropzone token={token} onNotice={onNotice} />
      </section>
    </>
  );
}
