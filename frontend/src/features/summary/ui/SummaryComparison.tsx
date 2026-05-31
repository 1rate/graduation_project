import type { ComparisonRow } from "@/features/summary/model/summary.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface SummaryComparisonProps {
  rows: ComparisonRow[];
  prevLabel: string;
}

export const SummaryComparison = ({ rows, prevLabel }: SummaryComparisonProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">По сравнению с прошлым периодом</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="text-left p-3 font-medium">Метрика</th>
              <th className="text-left p-3 font-medium">{prevLabel}</th>
              <th className="text-left p-3 font-medium">Текущий период</th>
              <th className="text-right p-3 font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-0">
                <td className="p-3">{row.label}</td>
                <td className="p-3 text-muted-foreground">{row.prev}</td>
                <td className="p-3">{row.current}</td>
                <td className="p-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      row.delta === "→" || row.delta === "→0"
                        ? "text-muted-foreground"
                        : row.deltaPositive
                          ? "text-green-600"
                          : "text-red-600"
                    }`}
                  >
                    {row.delta === "→" || row.delta === "→0" ? (
                      <Minus className="h-3 w-3" />
                    ) : row.deltaPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {row.delta}
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
