import type { MetricsData } from "@/features/metrics-overview/model/metric.types";
import { useSentimentStats } from "@/features/sentiment-stats";
import { useMemo } from "react";

export const useMetrics = (from?: string, to?: string): MetricsData | null => {
  const { data } = useSentimentStats(from, to);

  return useMemo(() => {
    if (!data) return null;

    const buckets = data.buckets;

    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    const positive = buckets.find((b) => b.key === "positive")?.count ?? 0;
    const neutral = buckets.find((b) => b.key === "neutral")?.count ?? 0;
    const negative = buckets.find((b) => b.key === "negative")?.count ?? 0;

    return {
      total: {
        label: "Всего обращений",
        value: total,
        countValue: total,
        format: "number",
      },
      positive: {
        label: "Позитивных",
        value: total > 0 ? Math.round((positive / total) * 100) : 0,
        countValue: positive,
        format: "percent",
      },
      neutral: {
        label: "Нейтральных",
        value: total > 0 ? Math.round((neutral / total) * 100) : 0,
        countValue: neutral,
        format: "percent",
      },
      negative: {
        label: "Негативных",
        value: total > 0 ? Math.round((negative / total) * 100) : 0,
        countValue: negative,
        format: "percent",
      },
    };
  }, [data]);
};
