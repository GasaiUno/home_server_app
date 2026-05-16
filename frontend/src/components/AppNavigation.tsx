import { ArrowDownToLine, CircleGauge, Clapperboard, FolderOpen, House, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const items = [
  { to: "/", label: "Главная", short: "Главная", icon: House },
  { to: "/media", label: "Медиа", short: "Медиа", icon: Clapperboard },
  { to: "/downloads", label: "Загрузки", short: "Загр.", icon: ArrowDownToLine },
  { to: "/files", label: "Файлы", short: "Файлы", icon: FolderOpen },
  { to: "/admin", label: "Админка", short: "Админ", icon: CircleGauge }
];

export function AppNavigation() {
  const [quickOpen, setQuickOpen] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState({ height: 0, left: 0, top: 0, width: 0 });
  const location = useLocation();
  const itemsRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const activeIndex = Math.max(
    items.findIndex((item) => item.to === location.pathname),
    0
  );

  useEffect(() => {
    const updateIndicator = () => {
      const itemsBox = itemsRef.current?.getBoundingClientRect();
      const activeBox = linkRefs.current[activeIndex]?.getBoundingClientRect();

      if (!itemsBox || !activeBox) return;

      setActiveIndicator({
        height: activeBox.height,
        left: activeBox.left - itemsBox.left,
        top: activeBox.top - itemsBox.top,
        width: activeBox.width
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeIndex]);

  return (
    <nav className="app-navigation" aria-label="Основная навигация">
      <div className="nav-dock">
        <div className="nav-brand">
          <span>HS</span>
          <small>Домашний сервер</small>
        </div>
        <div className="nav-items" ref={itemsRef}>
          <span
            className="nav-active-indicator"
            aria-hidden="true"
            style={{
              height: activeIndicator.height,
              transform: `translate3d(${activeIndicator.left}px, ${activeIndicator.top}px, 0)`,
              width: activeIndicator.width
            }}
          />
          {items.map((item, index) => (
            <NavLink
              key={item.to}
              ref={(node) => {
                linkRefs.current[index] = node;
              }}
              to={item.to}
              className={({ isActive }) => ["nav-link", isActive ? "active" : ""].filter(Boolean).join(" ")}
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
      </div>
    </nav>
  );
}
