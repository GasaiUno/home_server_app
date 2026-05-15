import { Activity, Download, Film, Folder, Home, KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Главная", short: "Главная", icon: Home },
  { to: "/media", label: "Медиа", short: "Медиа", icon: Film },
  { to: "/downloads", label: "Загрузки", short: "Загрузки", icon: Download },
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
        {items.map((item) => (
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
        ))}
      </div>
      <div className="nav-quick-wrap">
        <Link className="nav-add-desktop" to="/actions">
          <Plus size={18} aria-hidden="true" />
          <span>Добавить</span>
        </Link>
        <button
          type="button"
          className={quickOpen ? "nav-link nav-link-center active" : "nav-link nav-link-center"}
          aria-label="Быстрые действия"
          aria-expanded={quickOpen}
          onClick={() => setQuickOpen((value) => !value)}
        >
          <Plus size={20} aria-hidden="true" />
        </button>
        {quickOpen ? (
          <div className="nav-quick-menu">
            <Link to="/actions" onClick={() => setQuickOpen(false)}>
              Скачать YouTube
            </Link>
            <Link to="/actions" onClick={() => setQuickOpen(false)}>
              Добавить magnet
            </Link>
            <Link to="/actions" onClick={() => setQuickOpen(false)}>
              Загрузить .torrent
            </Link>
            <Link to="/files" onClick={() => setQuickOpen(false)}>
              Загрузить файл
            </Link>
            <Link to="/files" onClick={() => setQuickOpen(false)}>
              Создать папку
            </Link>
            <Link to="/settings" onClick={() => setQuickOpen(false)}>
              Настройки
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
