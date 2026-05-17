import type { TopCategory } from "@/features/summary/model/summary.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface SummaryTopCategoriesProps {
  categories: TopCategory[];
}

export const SummaryTopCategories = ({ categories }: SummaryTopCategoriesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Топ проблемных категорий</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="text-left p-3 font-medium">Категория</th>
              <th className="text-right p-3 font-medium">Обращений</th>
              <th className="text-right p-3 font-medium">%</th>
              <th className="text-right p-3 font-medium">Тренд</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.name} className="border-b last:border-0">
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-right">{c.count}</td>
                <td className="p-3 text-right text-muted-foreground">{c.percent}%</td>
                <td className="p-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      c.trend === 0
                        ? "text-muted-foreground"
                        : c.trend > 0
                          ? "text-red-600"
                          : "text-green-600"
                    }`}
                  >
                    {c.trend === 0 ? (
                      <Minus className="h-3 w-3" />
                    ) : c.trend > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {c.trend > 0 ? "+" : ""}
                    {c.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
