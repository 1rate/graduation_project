import { CategoryBadge } from "@/features/call-detail/ui/CategoryBadge";
import { SentimentBadge } from "@/features/call-detail/ui/SentimentBadge";
import type { IndexedMessage } from "@/shared/types/api";

interface HistoryRowProps {
  item: IndexedMessage;
  onClick: () => void;
}

export const HistoryRow = ({ item, onClick }: HistoryRowProps) => {
  return (
    <tr onClick={onClick} className="cursor-pointer border-b hover:bg-muted/50 transition-colors">
      <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
        {new Date(item.received_at).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="p-3 text-sm max-w-md">
        <p className="truncate">{item.text}</p>
      </td>
      <td className="p-3 whitespace-nowrap">
        {item.sentiment ? (
          <SentimentBadge sentiment={item.sentiment.label} score={item.sentiment.score} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3 whitespace-nowrap">
        {item.category ? (
          <CategoryBadge category={item.category.category} score={item.category.score} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
};
