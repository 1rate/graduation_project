import { useMemo } from "react";
import { useSentimentStats } from "@/features/sentiment-stats";
import type { MetricsData } from "@/features/metrics-overview/model/metric.types";

export const useMetrics = (from?: string, to?: string): MetricsData | null => {
  const { data } = useSentimentStats(from, to);

  return useMemo(() => {
    if (!data) return null;

    const buckets = data.buckets;
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    const positive = buckets.find((b) => b.key === "positive")?.count ?? 0;
    const neutral = buckets.find((b) => b.key === "neutral")?.count ?? 0;
    const negative = buckets.find((b) => b.key === "negative")?.count ?? 0;

    // Мок-тренды (заглушка, пока бэк не отдаёт предыдущий период)
    const prevTotal = Math.round(total * 0.92);
    const prevPositive = Math.round(positive * 0.88);
    const prevNeutral = Math.round(neutral * 1.05);
    const prevNegative = Math.round(negative * 0.95);

    return {
      total: {
        label: "Всего обращений",
        value: total,
        previousValue: prevTotal,
        format: "number",
      },
      positive: {
        label: "Позитивных",
        value: total > 0 ? Math.round((positive / total) * 100) : 0,
        previousValue: prevTotal > 0 ? Math.round((prevPositive / prevTotal) * 100) : 0,
        format: "percent",
      },
      neutral: {
        label: "Нейтральных",
        value: total > 0 ? Math.round((neutral / total) * 100) : 0,
        previousValue: prevTotal > 0 ? Math.round((prevNeutral / prevTotal) * 100) : 0,
        format: "percent",
      },
      negative: {
        label: "Негативных",
        value: total > 0 ? Math.round((negative / total) * 100) : 0,
        previousValue: prevTotal > 0 ? Math.round((prevNegative / prevTotal) * 100) : 0,
        format: "percent",
      },
    };
  }, [data]);
};
