import { Activity, Folder, Home, KeyRound, Rocket } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Главная", short: "Дом", icon: Home },
  { to: "/actions", label: "Действия", short: "Действ.", icon: Rocket },
  { to: "/files", label: "Файлы", short: "Файлы", icon: Folder },
  { to: "/admin", label: "Админка", short: "Админ", icon: Activity },
  { to: "/settings", label: "Настройки", short: "Токен", icon: KeyRound }
];

export function AppNavigation() {
  return (
    <nav className="app-navigation" aria-label="Основная навигация">
      <div className="nav-brand">
        <span>HS</span>
        <small>Home Server</small>
      </div>
      <div className="nav-items">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <item.icon size={20} aria-hidden="true" />
            <strong className="nav-label-full">{item.label}</strong>
            <strong className="nav-label-short">{item.short}</strong>
          </NavLink>
        ))}
      </div>
      <div className="nav-status">
        <span />
        <small>online</small>
      </div>
    </nav>
  );
}
