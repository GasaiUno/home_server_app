import { useState } from "react";
import { createFolder, uploadFile } from "../api";
import type { Notice } from "../types";
import { getErrorMessage } from "../utils";

type FileUploadProps = {
  token: string;
  path: string;
  onNotice: (notice: Notice) => void;
  onChanged: () => void;
};

export function FileUpload({ token, path, onNotice, onChanged }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitFile() {
    if (!file) return;
    setLoading(true);
    try {
      await uploadFile(token, path, file);
      setFile(null);
      onNotice({ type: "success", message: "Файл загружен" });
      onChanged();
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось загрузить файл: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }

  async function submitFolder() {
    if (!folderName.trim()) return;
    setLoading(true);
    try {
      await createFolder(token, `${path}/${folderName.trim()}`);
      setFolderName("");
      onNotice({ type: "success", message: "Папка создана" });
      onChanged();
    } catch (error) {
      onNotice({ type: "error", message: `Не удалось создать папку: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel file-tools">
      <label className="dropzone">
        <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <span>{file ? file.name : "Выберите файл для загрузки"}</span>
      </label>
      <button type="button" onClick={submitFile} disabled={!file || loading}>
        Загрузить
      </button>
      <input value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="Новая папка" />
      <button type="button" onClick={submitFolder} disabled={!folderName.trim() || loading}>
        Создать папку
      </button>
    </section>
  );
}
