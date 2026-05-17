import { useTimeline } from "@/features/timeline-stats/model/useTimeline";
import { DatePickerClearable } from "@/shared/components/DatePicker";
import { getCurrentWeekRange } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#eab308",
  negative: "#ef4444",
};

const LABELS: Record<string, string> = {
  positive: "Позитив",
  neutral: "Нейтрал",
  negative: "Негатив",
};

interface TrendChartProps {
  from?: string;
  to?: string;
  onFromChange?: (from: string) => void;
  onToChange?: (to: string) => void;
}

export const TrendChart = ({
  from: externalFrom,
  to: externalTo,
  onFromChange,
  onToChange,
}: TrendChartProps) => {
  const navigate = useNavigate();
  const defaultRange = useMemo(() => getCurrentWeekRange(), []);
  const [localFrom, setLocalFrom] = useState(externalFrom ?? defaultRange.from);
  const [localTo, setLocalTo] = useState(externalTo ?? defaultRange.to);

  const from = externalFrom ?? localFrom;
  const to = externalTo ?? localTo;
  const { data, isLoading, isError } = useTimeline("day", "sentiment", from, to);

  const handleFromChange = useCallback(
    (val: string) => {
      setLocalFrom(val);
      onFromChange?.(val);
    },
    [onFromChange],
  );

  const handleToChange = useCallback(
    (val: string) => {
      setLocalTo(val);
      onToChange?.(val);
    },
    [onToChange],
  );

  // Клик по точке: фильтруем историю по дате этой точки и выбранной тональности
  const handleDotClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload: any) => {
      if (!payload || !payload.payload) return;

      const { date } = payload.payload; // дата в формате "11 мая"
      const dataKey = payload.dataKey; // positive / neutral / negative

      if (!date || !dataKey) return;

      // Находим исходную точку, чтобы получить полную дату
      const point = data?.points.find((p) => {
        const d = new Date(p.bucket).toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "short",
        });
        return d === date;
      });

      if (point) {
        const bucketDate = new Date(point.bucket);
        const y = bucketDate.getFullYear();
        const m = String(bucketDate.getMonth() + 1).padStart(2, "0");
        const d = String(bucketDate.getDate()).padStart(2, "0");
        const day = `${y}-${m}-${d}`;

        navigate(`/history?sentiment=${dataKey}&from=${day}&to=${day}`);
      }
    },
    [data, navigate],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тренд по дням</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тренд по дням</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Не удалось загрузить данные
        </CardContent>
      </Card>
    );
  }

  const chartData = data.points.map((point) => ({
    date: new Date(point.bucket).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
    }),
    ...point.counts,
  }));

  const keys = Object.keys(data.points[0]?.counts ?? {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Тренд по дням</CardTitle>
          <div className="flex items-center gap-2">
            <DatePickerClearable value={from} onChange={handleFromChange} placeholder="С" />
            <span className="text-muted-foreground">—</span>
            <DatePickerClearable value={to} onChange={handleToChange} placeholder="По" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend formatter={(value: string) => LABELS[value] ?? value} />
            {keys.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[key] ?? "#6b7280"}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={key}
                activeDot={{
                  r: 6,
                  onClick: (_: unknown, payload: unknown) => handleDotClick(payload),
                  className: "cursor-pointer",
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
