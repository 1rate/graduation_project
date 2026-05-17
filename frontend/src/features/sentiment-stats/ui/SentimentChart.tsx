import { useSentimentStats } from "@/features/sentiment-stats/model/useSentimentStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  positive: "#22c55e", // green-500
  neutral: "#eab308", // yellow-500
  negative: "#ef4444", // red-500
};

const LABELS: Record<string, string> = {
  positive: "Позитив",
  neutral: "Нейтрал",
  negative: "Негатив",
};

interface SentimentChartProps {
  from?: string;
  to?: string;
}

export const SentimentChart = ({ from, to }: SentimentChartProps) => {
  const { data, isLoading, isError } = useSentimentStats(from, to);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тональность обращений</CardTitle>
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
          <CardTitle>Тональность обращений</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Не удалось загрузить данные
        </CardContent>
      </Card>
    );
  }

  const chartData = data.buckets.map((bucket) => ({
    name: LABELS[bucket.key] ?? bucket.key,
    value: bucket.count,
    color: COLORS[bucket.key as keyof typeof COLORS] ?? "#6b7280",
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тональность обращений</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} className="lg:!h-[300px]">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => {
                const pct = (percent ?? 0) * 100;
                return `${name} ${pct.toFixed(0)}%`;
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => {
                const num = Number(value) || 0;
                return [`${num} (${((num / total) * 100).toFixed(1)}%)`, "Обращений"];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
