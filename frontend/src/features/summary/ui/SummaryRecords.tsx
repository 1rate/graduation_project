import type { RecordItem } from "@/features/summary/model/summary.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { AlertTriangle, Star, ThumbsDown, ThumbsUp } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  best: ThumbsUp,
  worst: ThumbsDown,
  positive: Star,
  negative: AlertTriangle,
};

const colorMap: Record<string, string> = {
  best: "text-green-600",
  worst: "text-red-600",
  positive: "text-green-600",
  negative: "text-red-600",
};

interface SummaryRecordsProps {
  records: RecordItem[];
}

export const SummaryRecords = ({ records }: SummaryRecordsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Рекорды периода</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((r, i) => {
          const Icon = iconMap[r.type] ?? AlertTriangle;
          return (
            <div key={i} className="flex items-center gap-3 text-sm">
              <Icon className={`h-4 w-4 shrink-0 ${colorMap[r.type] ?? ""}`} />
              <span>{r.label}</span>
              <span className="text-muted-foreground">— {r.value}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
