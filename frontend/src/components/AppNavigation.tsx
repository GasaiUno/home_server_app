import { Activity, Home, KeyRound, Rocket } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/actions", label: "Actions", icon: Rocket },
  { to: "/admin", label: "Admin", icon: Activity },
  { to: "/settings", label: "Settings", icon: KeyRound }
];

export function AppNavigation() {
  return (
    <nav className="app-navigation" aria-label="Основная навигация">
      <div className="nav-brand">HS</div>
      <div className="nav-items">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <item.icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
