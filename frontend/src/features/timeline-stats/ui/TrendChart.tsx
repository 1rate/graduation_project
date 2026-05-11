import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTimeline } from "@/features/timeline-stats/model/useTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

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
}

export const TrendChart = ({ from, to }: TrendChartProps) => {
  const { data, isLoading, isError } = useTimeline("day", "sentiment", from, to);

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
        <CardTitle>Тренд по дням</CardTitle>
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
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
