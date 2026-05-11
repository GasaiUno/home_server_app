import { Activity, Download, Folder, Home, KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Главная", short: "Главная", icon: Home },
  { to: "/downloads", label: "Загрузки", short: "Загрузки", icon: Download },
  { to: "/actions", label: "Действия", short: "+", icon: Plus, center: true },
  { to: "/files", label: "Файлы", short: "Файлы", icon: Folder },
  { to: "/admin", label: "Админка", short: "Админка", icon: Activity },
  { to: "/settings", label: "Настройки", short: "Настр.", icon: KeyRound, desktopOnly: true }
];

export function AppNavigation() {
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <nav className="app-navigation" aria-label="Основная навигация">
      <div className="nav-brand">
        <span>HS</span>
        <small>Домашний сервер</small>
      </div>
      <div className="nav-items">
        {items.map((item) =>
          item.center ? (
            <div key={item.to} className="nav-quick-wrap">
              <NavLink to={item.to} className={({ isActive }) => (isActive ? "nav-link active nav-action-desktop" : "nav-link nav-action-desktop")}>
                <item.icon size={20} aria-hidden="true" />
                <strong className="nav-label-full">{item.label}</strong>
              </NavLink>
              <button
                type="button"
                className={quickOpen ? "nav-link nav-link-center active" : "nav-link nav-link-center"}
                aria-label="Быстрые действия"
                aria-expanded={quickOpen}
                onClick={() => setQuickOpen((value) => !value)}
              >
                <item.icon size={20} aria-hidden="true" />
                <strong className="nav-label-short">{item.short}</strong>
              </button>
              {quickOpen ? (
                <div className="nav-quick-menu">
                  <Link to="/actions" onClick={() => setQuickOpen(false)}>
                    Скачать YouTube
                  </Link>
                  <Link to="/actions" onClick={() => setQuickOpen(false)}>
                    Добавить magnet
                  </Link>
                  <Link to="/files" onClick={() => setQuickOpen(false)}>
                    Загрузить файл
                  </Link>
                  <Link to="/actions" onClick={() => setQuickOpen(false)}>
                    Открыть действия
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                ["nav-link", isActive ? "active" : "", item.desktopOnly ? "nav-link-desktop-only" : ""].filter(Boolean).join(" ")
              }
            >
              <item.icon size={20} aria-hidden="true" />
              <strong className="nav-label-full">{item.label}</strong>
              <strong className="nav-label-short">{item.short}</strong>
            </NavLink>
          )
        )}
      </div>
      <div className="nav-status">
        <span />
        <small>онлайн</small>
      </div>
    </nav>
  );
}
