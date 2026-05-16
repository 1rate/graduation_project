import { useCategoriesStats } from "@/features/categories-stats/model/useCategoriesStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CategoriesChartProps {
  from?: string;
  to?: string;
}

export const CategoriesChart = ({ from, to }: CategoriesChartProps) => {
  const { data, isLoading, isError } = useCategoriesStats(from, to);

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
        <CardTitle>Категории обращений</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250} className="lg:!h-[300px]">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="key" width={150} tick={{ fontSize: 12 }} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [value, "Обращений"]}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
