import type { StatsLineData } from "@/features/summary/model/summary.types";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";

interface SummaryStatsLineProps {
  data: StatsLineData;
}

export const SummaryStatsLine = ({ data }: SummaryStatsLineProps) => {
  const { total, posPct, negPct, negDelta, topCategory, topCategoryCount } = data;

  const isNegUp = negDelta > 0;
  const isNegDown = negDelta < 0;

  return (
    <Card>
      <CardContent className="p-4 text-sm leading-relaxed">
        <span>За выбранный период поступило </span>
        <span className="font-bold text-foreground">{total}</span>
        <span> обращений. </span>
        <span className="font-bold text-green-600">{posPct}%</span>
        <span> позитивных, </span>
        <span className="font-bold text-red-600">{negPct}%</span>
        <span> негативных. Негатив </span>
        <span
          className={cn(
            " gap-0.5 font-bold",
            isNegUp && "text-red-600",
            isNegDown && "text-green-600",
            negDelta === 0 && "text-muted-foreground",
          )}
        >
          {/* {isNegUp && <TrendingUp className="h-3.5 w-3.5" />}
          {isNegDown && <TrendingDown className="h-3.5 w-3.5" />}
          {negDelta === 0 && <Minus className="h-3.5 w-3.5" />} */}
          {isNegUp ? "вырос" : isNegDown ? "снизился" : "остался без изменений"}
        </span>
        {isNegUp && isNegDown && (
          <>
            <span> на </span>
            <span
              className={cn(
                "font-bold",
                isNegUp && "text-red-600",
                isNegDown && "text-green-600",
                negDelta === 0 && "text-muted-foreground",
              )}
            >
              {Math.abs(negDelta)} %.
            </span>
          </>
        )}
        <span> по сравнению с прошлым выбранным периодом. Основная проблема — </span>
        <span className="font-bold text-red-600">{topCategory}</span>
        <span> ({topCategoryCount} обращений).</span>
      </CardContent>
    </Card>
  );
};
