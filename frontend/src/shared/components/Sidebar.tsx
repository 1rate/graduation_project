import { Activity, FileText, History, LayoutDashboard, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256;

const links = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard },
  { to: "/summary", label: "Сводки", icon: FileText },
  { to: "/upload", label: "Загрузка", icon: Upload },
  { to: "/history", label: "История", icon: History },
];

interface SidebarProps {
  variant?: "desktop" | "mobile";
}

export const Sidebar = ({ variant = "desktop" }: SidebarProps) => {
  const isDesktop = variant === "desktop";

  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("sidebar-width");
    return saved ? Number(saved) : DEFAULT_WIDTH;
  });

  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isDesktop) return;
      e.preventDefault();
      isResizing.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [isDesktop],
  );

  useEffect(() => {
    if (!isDesktop) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      const currentWidth = sidebarRef.current?.offsetWidth;
      if (currentWidth) {
        localStorage.setItem("sidebar-width", String(currentWidth));
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDesktop]);

  return (
    <aside
      ref={sidebarRef}
      className="border-r bg-background h-full relative"
      style={
        isDesktop
          ? { width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }
          : undefined
      }
    >
      <div className="p-4 space-y-2 h-full overflow-auto">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg shrink-0 mb-4 w-full">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 mr-1">
            <Activity className="h-5 w-5" />
          </div>
          <span className="truncate">
            Tone<span className="text-primary">Call</span>
          </span>
        </Link>

        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors truncate ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Ресайз-ручка — только на десктопе */}
      {isDesktop && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30 transition-colors flex items-center justify-center group"
        >
          <div className="w-1 h-8 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
        </div>
      )}
    </aside>
  );
};
