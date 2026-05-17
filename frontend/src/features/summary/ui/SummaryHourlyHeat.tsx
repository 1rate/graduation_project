import type { HourlyData } from "@/features/summary/model/summary.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface SummaryHourlyHeatProps {
  data: HourlyData[];
}

export const SummaryHourlyHeat = ({ data }: SummaryHourlyHeatProps) => {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Негатив по часам</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {data.length === 0 && <p className="text-sm text-muted-foreground">Нет данных</p>}
        {data.map((d) => (
          <div key={d.hour} className="flex items-center gap-2 text-xs">
            <span className="w-10 text-right text-muted-foreground">
              {String(d.hour).padStart(2, "0")}:00
            </span>
            <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-sm transition-all"
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 text-muted-foreground">{d.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
