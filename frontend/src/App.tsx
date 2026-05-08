import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { KeyRound, Server } from "lucide-react";
import { getServices, getStatus } from "./api";
import { AppNavigation } from "./components/AppNavigation";
import { ActionsPage } from "./pages/ActionsPage";
import { AdminPage } from "./pages/AdminPage";
import { FilesPage } from "./pages/FilesPage";
import { HomePage } from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";
import type { Notice, ServiceItem, ServiceTarget, StatusResponse } from "./types";
import { getErrorMessage } from "./utils";

const TOKEN_KEY = "home-server-token";
const TARGET_KEY = "home-server-service-target";

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [draftToken, setDraftToken] = useState("");
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [serviceTarget, setServiceTarget] = useState<ServiceTarget>(() => {
    return localStorage.getItem(TARGET_KEY) === "_blank" ? "_blank" : "_self";
  });

  const loadDashboard = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const [statusPayload, servicesPayload] = await Promise.all([getStatus(token), getServices(token)]);
      setStatus(statusPayload);
      setServices(servicesPayload.services);
    } catch (error) {
      setStatus(null);
      setServices([]);
      setNotice({ type: "error", message: `Backend недоступен или token неверный: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  function saveToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextToken = draftToken.trim();
    if (!nextToken) {
      setNotice({ type: "error", message: "Введите access token" });
      return;
    }
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setDraftToken("");
  }

  function changeToken() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setStatus(null);
    setServices([]);
    setNotice(null);
  }

  function changeTarget(target: ServiceTarget) {
    localStorage.setItem(TARGET_KEY, target);
    setServiceTarget(target);
  }

  if (!token) {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <div className="brand-mark">
            <Server size={30} aria-hidden="true" />
          </div>
          <h1>Home Server</h1>
          <p>Введите access token для подключения к домашнему центру.</p>
          <form onSubmit={saveToken} className="auth-form">
            <label htmlFor="token">Access token</label>
            <div className="input-row">
              <KeyRound size={18} aria-hidden="true" />
              <input
                id="token"
                type="password"
                value={draftToken}
                onChange={(event) => setDraftToken(event.target.value)}
                placeholder="HOME_APP_TOKEN"
                autoComplete="current-password"
              />
            </div>
            <button type="submit">Войти</button>
          </form>
          {notice ? <p className={`notice ${notice.type}`}>{notice.message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <div className="app-layout">
      <AppNavigation />
      <main className="app-shell">
        {notice ? <div className={`notice ${notice.type}`}>{notice.message}</div> : null}
        <Routes>
          <Route
            path="/"
            element={<HomePage token={token} services={services} status={status} loading={loading} serviceTarget={serviceTarget} />}
          />
          <Route path="/actions" element={<ActionsPage token={token} onNotice={setNotice} />} />
          <Route path="/files" element={<FilesPage token={token} onNotice={setNotice} />} />
          <Route
            path="/admin"
            element={
              <AdminPage
                token={token}
                services={services}
                status={status}
                loading={loading}
                onRefresh={loadDashboard}
                onNotice={setNotice}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                status={status}
                serviceTarget={serviceTarget}
                onTargetChange={changeTarget}
                onChangeToken={changeToken}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
