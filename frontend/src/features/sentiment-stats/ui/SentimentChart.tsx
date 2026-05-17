import { useSentimentStats } from "@/features/sentiment-stats/model/useSentimentStats";
import { DatePickerClearable } from "@/shared/components/DatePicker";
import { getCurrentWeekRange } from "@/shared/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  positive: "#22c55e",
  neutral: "#eab308",
  negative: "#ef4444",
};

const LABELS: Record<string, string> = {
  positive: "Позитив",
  neutral: "Нейтрал",
  negative: "Негатив",
};

interface SentimentChartProps {
  from?: string;
  to?: string;
  onFromChange?: (from: string) => void;
  onToChange?: (to: string) => void;
}

export const SentimentChart = ({
  from: externalFrom,
  to: externalTo,
  onFromChange,
  onToChange,
}: SentimentChartProps) => {
  const navigate = useNavigate();
  const defaultRange = useMemo(() => getCurrentWeekRange(), []);
  const [localFrom, setLocalFrom] = useState(externalFrom ?? defaultRange.from);
  const [localTo, setLocalTo] = useState(externalTo ?? defaultRange.to);

  const from = externalFrom ?? localFrom;
  const to = externalTo ?? localTo;
  const { data, isLoading, isError } = useSentimentStats(from, to);

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

  const handlePieClick = useCallback(
    (data: { name?: string }) => {
      if (!data.name) return;
      const sentimentMap: Record<string, string> = {
        Позитив: "positive",
        Нейтрал: "neutral",
        Негатив: "negative",
      };
      const sentiment = sentimentMap[data.name];
      if (sentiment) {
        navigate(`/history?sentiment=${sentiment}&from=${from}&to=${to}`);
      }
    },
    [from, to, navigate],
  );

  const handleLegendClick = useCallback(
    (data: { value?: string }) => {
      if (!data.value) return;
      const sentimentMap: Record<string, string> = {
        Позитив: "positive",
        Нейтрал: "neutral",
        Негатив: "negative",
      };
      const sentiment = sentimentMap[data.value];
      if (sentiment) {
        navigate(`/history?sentiment=${sentiment}&from=${from}&to=${to}`);
      }
    },
    [from, to, navigate],
  );
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Тональность обращений</CardTitle>
          <div className="flex items-center gap-2">
            <DatePickerClearable value={from} onChange={handleFromChange} placeholder="С" />
            <span className="text-muted-foreground">—</span>
            <DatePickerClearable value={to} onChange={handleToChange} placeholder="По" />
          </div>
        </div>
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
              onClick={handlePieClick}
              className="cursor-pointer"
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
            <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: "pointer" }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
