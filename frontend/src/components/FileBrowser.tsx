import { Download, Folder, Trash2 } from "lucide-react";
import { deleteFilePath, downloadFile } from "../api";
import type { FileItem, FilesListResponse, Notice } from "../types";
import { formatBytes } from "../utils";
import { FileBreadcrumbs } from "./FileBreadcrumbs";
import { FileUpload } from "./FileUpload";

type FileBrowserProps = {
  token: string;
  data: FilesListResponse | null;
  path: string;
  loading: boolean;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onNotice: (notice: Notice) => void;
};

export function FileBrowser({ token, data, path, loading, onNavigate, onRefresh, onNotice }: FileBrowserProps) {
  async function remove(item: FileItem) {
    if (!window.confirm(`Удалить ${item.name}?`)) return;
    try {
      await deleteFilePath(token, item.path);
      onNotice({ type: "success", message: "Удалено" });
      onRefresh();
    } catch {
      onNotice({ type: "error", message: "Удаление запрещено или не удалось" });
    }
  }

  async function save(item: FileItem) {
    try {
      const blob = await downloadFile(token, item.path);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      onNotice({ type: "error", message: "Не удалось скачать файл" });
    }
  }

  return (
    <section className="files-page">
      <FileBreadcrumbs path={path} onNavigate={onNavigate} />
      <FileUpload token={token} path={path} onNotice={onNotice} onChanged={onRefresh} />
      <section className="panel table-panel">
        <div className="panel-header">
          <h2>Файлы</h2>
          <span>{loading ? "..." : data?.items.length ?? 0}</span>
        </div>
        <div className="file-list">
          {data?.items.map((item) => (
            <article key={item.path} className="file-row">
              <button type="button" className="file-main" onClick={() => item.type === "directory" && onNavigate(item.path)}>
                {item.type === "directory" ? <Folder size={20} /> : <Download size={20} />}
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.type === "directory" ? "Папка" : `${formatBytes(item.size)} · ${new Date(item.modified_at).toLocaleString("ru-RU")}`}</small>
                </span>
              </button>
              {item.type === "file" ? (
                <button className="icon-link" type="button" onClick={() => void save(item)}>
                  <Download size={17} />
                </button>
              ) : null}
              {data.allow_delete ? (
                <button type="button" className="icon-danger" onClick={() => remove(item)}>
                  <Trash2 size={17} />
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
