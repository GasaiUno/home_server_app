import { useCallback, useEffect, useState } from "react";
import { getFiles } from "../api";
import { FileBrowser } from "../components/FileBrowser";
import { PageHeader } from "../components/PageHeader";
import type { FilesListResponse, Notice } from "../types";
import { getErrorMessage } from "../utils";

type FilesPageProps = {
  token: string;
  onNotice: (notice: Notice) => void;
};

export function FilesPage({ token, onNotice }: FilesPageProps) {
  const [path, setPath] = useState("media");
  const [files, setFiles] = useState<FilesListResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      setFiles(await getFiles(token, path));
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось открыть файлы: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }, [onNotice, path, token]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  return (
    <>
      <PageHeader kicker="Файлы" title="Файлы" subtitle="Просмотр, загрузка и управление разрешёнными папками сервера." />
      <FileBrowser token={token} data={files} path={path} loading={loading} onNavigate={setPath} onRefresh={loadFiles} onNotice={onNotice} />
    </>
  );
}
