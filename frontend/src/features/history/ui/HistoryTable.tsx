import { HistoryRow } from "@/features/history/ui/HistoryRow";
import type { IndexedMessage } from "@/shared/types/api";
import { Skeleton } from "@/shared/ui/skeleton";

interface HistoryTableProps {
  items: IndexedMessage[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
}

export const HistoryTable = ({ items, isLoading, onRowClick }: HistoryTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        По вашему запросу ничего не найдено
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="p-3 font-medium">Дата</th>
            <th className="p-3 font-medium">Текст</th>
            <th className="p-3 font-medium">Тональность</th>
            <th className="p-3 font-medium">Категория</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <HistoryRow
              key={item.message_id}
              item={item}
              onClick={() => onRowClick(item.message_id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
