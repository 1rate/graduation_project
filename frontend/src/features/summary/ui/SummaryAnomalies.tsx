import type { AnomalyItem } from "@/features/summary/model/summary.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { AlertTriangle } from "lucide-react";

interface SummaryAnomaliesProps {
  items: AnomalyItem[];
}

export const SummaryAnomalies = ({ items }: SummaryAnomaliesProps) => {
  return (
    <Card className="border-yellow-500">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          Аномалии
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((a) => (
          <div key={a.date} className="text-sm">
            <span className="font-medium">{a.date}</span> — {a.description}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
