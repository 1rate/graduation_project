import { useLogout } from "@/features/auth";
import { CategoryFilterTrigger } from "@/features/category-filter";
import { tokenStorage } from "@/shared/api";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Activity, Bell, ChevronDown, ChevronRight, Home, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

const routeLabels: Record<string, string> = {
  "": "Дашборд",
  upload: "Загрузка",
  history: "История",
  summary: "Сводки",
};

function parseJwt(token: string): { username?: string; role?: string } | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload ?? ""));
  } catch {
    return null;
  }
}

const Breadcrumbs = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, idx) => {
    const path = "/" + segments.slice(0, idx + 1).join("/");
    const isLast = idx === segments.length - 1;
    const label = routeLabels[seg] ?? seg;

    return { path, label, isLast };
  });

  return (
    <nav className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export const Header = () => {
  const { mutate: logout } = useLogout();

  const [open, setOpen] = useState(false);

  const token = tokenStorage.getAccessToken();
  const jwt = token ? parseJwt(token) : null;
  const userName = jwt?.username ?? "Пользователь";
  const userRole = jwt?.role ?? "user";

  const pendingCount = 3;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* ========== Левая часть ========== */}
        <div className="flex items-center gap-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="lg:hidden">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar variant="mobile" onLinkClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Breadcrumbs />
          <Link to="/" className="flex lg:hidden items-center gap-2 font-semibold text-lg shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline-block">
              Tone<span className="text-primary">Call</span>
            </span>
          </Link>
        </div>

        {/* ========== Правая часть ========== */}

        <div className="flex items-center gap-2">
          <CategoryFilterTrigger />
          {pendingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge
                    variant="destructive"
                    className="absolute -right-0.5 -top-0.5 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                  >
                    {pendingCount}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {pendingCount}{" "}
                {pendingCount === 3 ? "обращение" : pendingCount < 5 ? "обращения" : "обращений"} в
                обработке
              </TooltipContent>
            </Tooltip>
          )}

          <div className="hidden sm:block h-8 w-px bg-border mx-1" />

          {/* Профиль */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start text-sm">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
                </div>
                <ChevronDown className="hidden lg:block h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
