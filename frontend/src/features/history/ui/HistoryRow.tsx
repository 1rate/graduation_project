import type { UserItem } from "@/features/users";
import type { IndexedMessage } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HistoryRowProps {
  item: IndexedMessage;
  users: UserItem[];
  onClick: () => void;
}

const sentimentBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  positive: { label: "Позитив", variant: "default" },
  neutral: { label: "Нейтрал", variant: "secondary" },
  negative: { label: "Негатив", variant: "destructive" },
};

const getUserName = (userId: string | undefined, users: UserItem[]): string => {
  if (!userId) return "—";
  const user = users.find((u) => u.id === userId);
  return user?.username ?? userId.slice(0, 8) + "...";
};

export const HistoryRow = ({ item, users, onClick }: HistoryRowProps) => {
  const navigate = useNavigate();

  const sentiment = item.sentiment?.label ?? "neutral";
  const badge = sentimentBadge[sentiment] ?? sentimentBadge.neutral;

  return (
    <tr onClick={onClick} className="border-b cursor-pointer hover:bg-muted/50 transition-colors">
      <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
        {new Date(item.received_at).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="p-3 text-sm whitespace-nowrap">{getUserName(item.user_id, users)}</td>
      <td className="p-3 text-sm max-w-[300px] truncate">{item.text}</td>
      <td className="p-3">
        <Badge variant={badge?.variant}>{badge?.label}</Badge>
      </td>
      <td className="p-3 text-sm text-muted-foreground max-w-[150px] truncate">
        {item.category?.category ?? "—"}
      </td>
      <td className="p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/history/${item.message_id}`);
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};
