import { HistoryTable } from "@/features/history/ui/HistoryTable";
import { useSearch } from "@/features/search/model/useSearch";
import { useUserDetail, useUsers } from "@/features/users/model/useUsers";
import { Heading } from "@/shared/components/Heading";
import { Page } from "@/shared/components/Page";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { ArrowLeft, Calendar, Mail, Shield, Tag } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading, isError } = useUserDetail(id!);
  const { data: usersData } = useUsers();
  const allUsers = usersData?.users ?? [];

  const { data: callsData, isLoading: callsLoading } = useSearch({
    q: "",
    from: "",
    to: "",
    page: 1,
    size: 50,
  });

  // Фильтруем обращения только этого пользователя
  const userCalls = callsData?.items?.filter((item) => item.user_id === id) ?? [];

  if (isLoading) {
    return (
      <Page>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Page>
    );
  }

  if (isError || !user) {
    return (
      <Page>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Пользователь не найден</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/users")}>
            Вернуться к списку
          </Button>
        </div>
      </Page>
    );
  }

  const roleBadge =
    user.role === "admin"
      ? { label: "Админ", variant: "default" as const }
      : { label: "Пользователь", variant: "secondary" as const };

  return (
    <Page>
      {/* Хедер с возвратом */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/users")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Heading>{user.username}</Heading>
      </div>

      {/* Карточка с информацией */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о пользователе</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Имя пользователя</p>
                <p className="text-sm font-medium">{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Роль</p>
                <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Дата создания</p>
                <p className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleString("ru-RU")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="text-sm font-medium font-mono">{user.id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Назначенные категории */}
          {user.categories && user.categories.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Назначенные категории</p>
              <div className="flex flex-wrap gap-1">
                {user.categories.map((cat) => (
                  <Badge key={cat.id} variant="outline">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Обращения пользователя */}
      <Card>
        <CardHeader>
          <CardTitle>
            Обращения пользователя
            {callsData && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({userCalls.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {callsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : userCalls.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              У пользователя пока нет обращений
            </p>
          ) : (
            <HistoryTable
              items={userCalls}
              isLoading={false}
              users={allUsers}
              onRowClick={(callId) => navigate(`/history/${callId}`)}
            />
          )}
        </CardContent>
      </Card>
    </Page>
  );
};
