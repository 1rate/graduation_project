import type { IndexedMessage } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sentimentBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  positive: { label: "Позитив", variant: "default" },
  neutral: { label: "Нейтрал", variant: "secondary" },
  negative: { label: "Негатив", variant: "destructive" },
};

interface HistoryRowProps {
  item: IndexedMessage;
  onClick: () => void;
}

export const HistoryRow = ({ item, onClick }: HistoryRowProps) => {
  const navigate = useNavigate();
  const sentiment = item.sentiment?.label ?? "neutral";
  const badge = sentimentBadge[sentiment] ?? sentimentBadge.neutral;

  return (
    <tr className="border-b hover:bg-muted/50 cursor-pointer transition-colors" onClick={onClick}>
      <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
        {new Date(item.received_at).toLocaleString("ru-RU")}
      </td>
      <td className="p-3 text-sm max-w-md truncate">{item.text}</td>
      <td className="p-3">
        <Badge variant={badge?.variant}>{badge?.label}</Badge>
      </td>
      <td className="p-3 text-sm text-muted-foreground">{item.category?.category ?? "—"}</td>
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
