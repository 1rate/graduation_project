import type { UserItem } from "@/features/users/model/useUsers";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UsersTableProps {
  users: UserItem[];
  isLoading: boolean;
}

const roleBadge = (role: string) => {
  return role === "admin"
    ? { label: "Админ", variant: "default" as const }
    : { label: "Пользователь", variant: "secondary" as const };
};

export const UsersTable = ({ users, isLoading }: UsersTableProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase())),
    [users, search],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени..."
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <div className="hidden md:grid grid-cols-[1fr_120px_150px] gap-3 px-4 py-3 text-sm font-medium text-muted-foreground bg-muted/50">
          <div>Имя пользователя</div>
          <div>Роль</div>
          <div>Создан</div>
        </div>
        <div className="divide-y">
          {filtered.map((user) => {
            const badge = roleBadge(user.role);
            return (
              <div
                key={user.id}
                onClick={() => navigate(`/users/${user.id}`)}
                className="grid grid-cols-1 md:grid-cols-[1fr_120px_150px] gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors items-center"
              >
                <p className="text-sm font-medium">{user.username}</p>
                <Badge variant={badge.variant} className="w-fit">
                  {badge.label}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Пользователи не найдены
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
