import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import type { MetricData } from "@/features/metrics-overview/model/metric.types";

interface MetricCardProps {
  metric: MetricData;
  variant?: "default" | "positive" | "neutral" | "negative";
}

const variantStyles = {
  default: "",
  positive: "text-green-600",
  neutral: "text-yellow-600",
  negative: "text-red-600",
} as const;

export const MetricCard = ({ metric, variant = "default" }: MetricCardProps) => {
  const diff = metric.value - metric.previousValue;
  const diffPercent =
    metric.previousValue > 0 ? Math.round((Math.abs(diff) / metric.previousValue) * 100) : 0;
  const isUp = diff >= 0;
  const isZero = diff === 0;

  const formattedValue =
    metric.format === "percent" ? `${metric.value}%` : metric.value.toLocaleString("ru-RU");

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{metric.label}</p>
        <p className={`text-3xl font-bold mt-1 ${variantStyles[variant]}`}>{formattedValue}</p>
        <div className="flex items-center gap-1 mt-2">
          {!isZero && (
            <>
              {isUp ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </>
          )}
          <span
            className={`text-sm ${
              isUp ? "text-green-600" : isZero ? "text-muted-foreground" : "text-red-600"
            }`}
          >
            {isZero ? "Без изменений" : `${isUp ? "+" : ""}${diffPercent}% к пред. периоду`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
