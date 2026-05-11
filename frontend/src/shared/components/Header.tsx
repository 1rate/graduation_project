import { useLogout } from "@/features/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
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
import { Input } from "@/shared/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Activity, Bell, ChevronDown, LogOut, Menu, Search, Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const Header = () => {
  const { mutate: logout } = useLogout();
  const [searchFocused, setSearchFocused] = useState(false);

  // Заглушка — позже заменим на реальные данные
  const pendingCount = 3;
  const userName = "Алексей";
  const userEmail = "alex@example.com";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* ========== Левая часть ========== */}
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger className="lg:hidden">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar variant="mobile" />
            </SheetContent>
          </Sheet>
          {/* Лого */}
          <Link to="/" className="flex lg:hidden items-center gap-2 font-semibold text-lg shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline-block">
              Tone<span className="text-primary">Call</span>
            </span>
          </Link>

          {/* Поиск (скрыт на мобилке, показывается по фокусу или на десктопе) */}
          <div
            className={`hidden md:flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 transition-all ${
              searchFocused ? "w-72 border-primary/50 bg-background" : "w-48"
            }`}
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="search"
              placeholder="Поиск..."
              className="h-7 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {/* ========== Правая часть ========== */}
        <div className="flex items-center gap-2">
          {/* Статус системы */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="text-xs text-muted-foreground">Система активна</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Все сервисы работают</TooltipContent>
          </Tooltip>

          {/* В обработке */}
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

          {/* Разделитель */}
          <div className="hidden sm:block h-8 w-px bg-border mx-1" />

          {/* Профиль */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start text-sm">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
                <ChevronDown className="hidden lg:block h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </DropdownMenuItem>
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
