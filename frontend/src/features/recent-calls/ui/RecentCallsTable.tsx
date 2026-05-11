import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useRecentCalls } from "@/features/recent-calls/model/useRecentCalls";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

const sentimentBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  positive: { label: "Позитив", variant: "default" },
  neutral: { label: "Нейтрал", variant: "secondary" },
  negative: { label: "Негатив", variant: "destructive" },
};

export const RecentCallsTable = () => {
  const { data, isLoading, isError } = useRecentCalls(5);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Последние обращения</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Последние обращения</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Не удалось загрузить данные
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Последние обращения</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
          Все обращения
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.items.map((call) => {
            const sentiment = call.sentiment?.label ?? "neutral";
            const badge = sentimentBadge[sentiment] ?? sentimentBadge.neutral;

            return (
              <div
                key={call.message_id}
                onClick={() => navigate(`/calls/${call.message_id}`)}
                className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{call.text}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {new Date(call.received_at).toLocaleString("ru-RU")}
                  </p>
                </div>
                <Badge variant={badge?.variant} className="ml-3 shrink-0">
                  {badge?.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
