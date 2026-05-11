import { useCallback, useEffect, useState } from "react";
import { deleteTorrent, getTorrents, pauseTorrent, resumeTorrent } from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { TorrentTable } from "../components/TorrentTable";
import type { Notice, TorrentItem } from "../types";
import { getErrorMessage } from "../utils";

type DownloadsPageProps = {
  token: string;
  onNotice: (notice: Notice) => void;
};

export function DownloadsPage({ token, onNotice }: DownloadsPageProps) {
  const [torrents, setTorrents] = useState<TorrentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TorrentItem | null>(null);

  const loadTorrents = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await getTorrents(token);
      setTorrents(payload.items);
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось загрузить список загрузок: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }, [onNotice, token]);

  useEffect(() => {
    void loadTorrents();
    const id = window.setInterval(() => void loadTorrents(), 8000);
    return () => window.clearInterval(id);
  }, [loadTorrents]);

  async function runTorrentAction(action: "pause" | "resume", hash: string) {
    setLoading(true);
    try {
      if (action === "pause") await pauseTorrent(token, hash);
      else await resumeTorrent(token, hash);
      onNotice({ type: "success", message: action === "pause" ? "Торрент поставлен на паузу" : "Торрент продолжен" });
      await loadTorrents();
    } catch (error) {
      onNotice({ type: "error", message: `Действие не выполнено: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }

  async function confirmDeleteTorrent() {
    if (!pendingDelete) return;
    setLoading(true);
    try {
      await deleteTorrent(token, pendingDelete.hash, false);
      onNotice({ type: "success", message: "Торрент удалён из списка" });
      setPendingDelete(null);
      await loadTorrents();
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось удалить торрент: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader kicker="домашняя очередь" title="Загрузки" subtitle="Торренты, YouTube и текущая очередь." />
      <TorrentTable
        torrents={torrents}
        loading={loading}
        onPause={(hash) => void runTorrentAction("pause", hash)}
        onResume={(hash) => void runTorrentAction("resume", hash)}
        onDelete={setPendingDelete}
      />
      {pendingDelete ? (
        <ConfirmDialog
          title="Удалить торрент?"
          text={`Удалить "${pendingDelete.name}" из qBittorrent? Файлы останутся на диске.`}
          confirmLabel="Удалить"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDeleteTorrent}
        />
      ) : null}
    </>
  );
}
