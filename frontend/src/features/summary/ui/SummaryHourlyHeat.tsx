import type { HourlyData, SummaryPeriod } from "@/features/summary/model/summary.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useMemo } from "react";

interface SummaryHourlyHeatProps {
  data: HourlyData[];
  period: SummaryPeriod;
}

export const SummaryHourlyHeat = ({ data, period }: SummaryHourlyHeatProps) => {
  const max = Math.max(...data.map((d) => d.count), 1);

  const displayData = useMemo(() => {
    if (period === "today" || data.length <= 24) return data;

    // Группируем по дням (hour / 24 = номер дня от начала периода)
    const byDay = new Map<number, { count: number; date: string }>();
    data.forEach((d) => {
      const dayIndex = Math.floor(d.hour / 24);
      const existing = byDay.get(dayIndex);
      if (existing) {
        existing.count += d.count;
      } else {
        // Вычисляем дату: начало периода + dayIndex дней
        const date = new Date();
        date.setDate(date.getDate() - (Math.floor(data.length / 24) - 1) + dayIndex);
        byDay.set(dayIndex, {
          count: d.count,
          date: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
        });
      }
    });

    return [...byDay.entries()]
      .map(([hour, val]) => ({ hour, count: val.count, label: val.date }))
      .sort((a, b) => a.hour - b.hour);
  }, [data, period]);

  const label = (item: { hour: number; label?: string }) => {
    if (period === "today") return `${String(item.hour).padStart(2, "0")}:00`;
    return item.label ?? `День ${item.hour + 1}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Негатив {period === "today" ? "по часам" : "по дням"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {displayData.length === 0 && <p className="text-sm text-muted-foreground">Нет данных</p>}
        {displayData.map((d) => (
          <div key={d.hour} className="flex items-center gap-2 text-xs">
            <span className="w-14 text-right text-muted-foreground">{label(d)}</span>
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
