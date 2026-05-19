import { useCategoriesStats } from "@/features/categories-stats/model/useCategoriesStats";
import { DatePickerClearable } from "@/shared/components/DatePicker";
import { getCurrentWeekRange } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CategoriesChartProps {
  from?: string;
  to?: string;
  onFromChange?: (from: string) => void;
  onToChange?: (to: string) => void;
}

export const CategoriesChart = ({
  from: externalFrom,
  to: externalTo,
  onFromChange,
  onToChange,
}: CategoriesChartProps) => {
  const navigate = useNavigate();
  const defaultRange = useMemo(() => getCurrentWeekRange(), []);
  const [localFrom, setLocalFrom] = useState(externalFrom ?? defaultRange.from);
  const [localTo, setLocalTo] = useState(externalTo ?? defaultRange.to);

  const from = externalFrom ?? localFrom;
  const to = externalTo ?? localTo;
  const { data, isLoading, isError } = useCategoriesStats(from, to);

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

  const handleBarClick = useCallback(
    (entry: { key?: string }) => {
      if (entry.key) {
        navigate(`/history?categories=${encodeURIComponent(entry.key)}&from=${from}&to=${to}`);
      }
    },
    [from, to, navigate],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Категории обращений</CardTitle>
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
          <CardTitle>Категории обращений</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Не удалось загрузить данные
        </CardContent>
      </Card>
    );
  }

  const sorted = [...data.buckets].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Категории обращений</CardTitle>
          <div className="flex items-center gap-2">
            <DatePickerClearable value={from} onChange={handleFromChange} placeholder="С" />
            <span className="text-muted-foreground">—</span>
            <DatePickerClearable value={to} onChange={handleToChange} placeholder="По" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} className="lg:!h-[300px]">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 5, right: 30, left: -50, bottom: 5 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(data: any) => {
              if (data?.activePayload?.[0]) {
                handleBarClick(data.activePayload[0].payload);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="key" width={150} tick={{ fontSize: 12 }} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [value, "Обращений"]}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
              className="cursor-pointer"
              onClick={({ payload }) => handleBarClick(payload)}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
