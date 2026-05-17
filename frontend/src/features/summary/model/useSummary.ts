import { useCategoriesStats } from "@/features/categories-stats";
import { useSentimentStats } from "@/features/sentiment-stats";
import type {
  AnomalyItem,
  ComparisonRow,
  HourlyData,
  PeriodRange,
  RecordItem,
  StatsLineData,
  SummaryData,
  SummaryPeriod,
  TopCategory,
} from "@/features/summary/model/summary.types";
import { useTimeline } from "@/features/timeline-stats";
import { getCurrentWeekRange } from "@/shared/lib/utils";
import { useMemo } from "react";

const getRange = (period: SummaryPeriod): { current: PeriodRange; prev: PeriodRange } => {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  switch (period) {
    case "today": {
      const today = fmt(now);
      const yesterday = fmt(new Date(now.getTime() - 86400000));
      return {
        current: { from: today, to: today, label: "Сегодня", prevLabel: "Вчера" },
        prev: { from: yesterday, to: yesterday, label: "Вчера", prevLabel: "Позавчера" },
      };
    }
    case "week": {
      const { from, to } = getCurrentWeekRange();
      const prevFrom = fmt(new Date(new Date(from).getTime() - 7 * 86400000));
      const prevTo = fmt(new Date(new Date(to).getTime() - 7 * 86400000));
      return {
        current: { from, to, label: "Эта неделя", prevLabel: "Прошлая неделя" },
        prev: { from: prevFrom, to: prevTo, label: "Прошлая неделя", prevLabel: "Позапрошлая" },
      };
    }
    case "month": {
      const firstDay = fmt(new Date(now.getFullYear(), now.getMonth(), 1));
      const lastDay = fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      const prevFirstDay = fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const prevLastDay = fmt(new Date(now.getFullYear(), now.getMonth(), 0));
      return {
        current: { from: firstDay, to: lastDay, label: "Этот месяц", prevLabel: "Прошлый месяц" },
        prev: {
          from: prevFirstDay,
          to: prevLastDay,
          label: "Прошлый месяц",
          prevLabel: "Позапрошлый",
        },
      };
    }
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const firstDay = fmt(new Date(now.getFullYear(), q * 3, 1));
      const lastDay = fmt(new Date(now.getFullYear(), q * 3 + 3, 0));
      const prevFirstDay = fmt(new Date(now.getFullYear(), q * 3 - 3, 1));
      const prevLastDay = fmt(new Date(now.getFullYear(), q * 3, 0));
      return {
        current: {
          from: firstDay,
          to: lastDay,
          label: "Этот квартал",
          prevLabel: "Прошлый квартал",
        },
        prev: {
          from: prevFirstDay,
          to: prevLastDay,
          label: "Прошлый квартал",
          prevLabel: "Позапрошлый",
        },
      };
    }
    case "year": {
      const firstDay = fmt(new Date(now.getFullYear(), 0, 1));
      const lastDay = fmt(new Date(now.getFullYear(), 11, 31));
      const prevFirstDay = fmt(new Date(now.getFullYear() - 1, 0, 1));
      const prevLastDay = fmt(new Date(now.getFullYear() - 1, 11, 31));
      return {
        current: { from: firstDay, to: lastDay, label: "Этот год", prevLabel: "Прошлый год" },
        prev: {
          from: prevFirstDay,
          to: prevLastDay,
          label: "Прошлый год",
          prevLabel: "Позапрошлый",
        },
      };
    }
  }
};

const pct = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0;

const deltaStr = (cur: number, prev: number, unit = ""): { str: string; positive: boolean } => {
  const diff = cur - prev;
  if (diff === 0) return { str: "→0", positive: true };
  const sign = diff > 0 ? "+" : "";
  return {
    str: `${sign}${diff}${unit}`,
    positive: diff > 0,
  };
};

export const useSummary = (period: SummaryPeriod): SummaryData | null => {
  const { current, prev } = getRange(period);

  const { data: sentiment } = useSentimentStats(current.from, current.to);
  const { data: prevSentiment } = useSentimentStats(prev.from, prev.to);
  const { data: categories } = useCategoriesStats(current.from, current.to);
  const { data: prevCategories } = useCategoriesStats(prev.from, prev.to);
  const { data: timeline } = useTimeline("day", "sentiment", current.from, current.to);
  const { data: hourlyTimeline } = useTimeline("hour", "sentiment", current.from, current.to);

  return useMemo(() => {
    if (!sentiment || !categories || !prevSentiment || !prevCategories) return null;

    const buckets = sentiment.buckets;
    const prevBuckets = prevSentiment.buckets;

    const total = buckets.reduce((s, b) => s + b.count, 0);
    const prevTotal = prevBuckets.reduce((s, b) => s + b.count, 0);
    const pos = buckets.find((b) => b.key === "positive")?.count ?? 0;
    const neg = buckets.find((b) => b.key === "negative")?.count ?? 0;
    const prevPos = prevBuckets.find((b) => b.key === "positive")?.count ?? 0;
    const prevNeg = prevBuckets.find((b) => b.key === "negative")?.count ?? 0;

    const posPct = pct(pos, total);
    const negPct = pct(neg, total);
    const prevPosPct = pct(prevPos, prevTotal);
    const prevNegPct = pct(prevNeg, prevTotal);

    const topCat = [...categories.buckets].sort((a, b) => b.count - a.count)[0];
    const prevTopCat = [...prevCategories.buckets].sort((a, b) => b.count - a.count)[0];

    // 3.1 Stats line
    const negDelta = negPct - prevNegPct;

    const statsLineData: StatsLineData = {
      total,
      posPct,
      negPct,
      negDelta,
      prevLabel: current.prevLabel,
      topCategory: topCat?.key ?? "—",
      topCategoryCount: topCat?.count ?? 0,
    };
    // 3.2 Comparison
    const comparison: ComparisonRow[] = [
      {
        label: "Всего обращений",
        prev: String(prevTotal),
        current: String(total),
        delta: deltaStr(total, prevTotal).str,
        deltaPositive: deltaStr(total, prevTotal).positive,
      },
      {
        label: "Позитивных",
        prev: `${prevPosPct}%`,
        current: `${posPct}%`,
        delta: deltaStr(posPct, prevPosPct, " %").str,
        deltaPositive: deltaStr(posPct, prevPosPct).positive,
      },
      {
        label: "Негативных",
        prev: `${prevNegPct}%`,
        current: `${negPct}%`,
        delta: deltaStr(negPct, prevNegPct, " %").str,
        deltaPositive: deltaStr(negPct, prevNegPct).positive,
      },
      {
        label: "Топ-категория",
        prev: prevTopCat?.key ?? "—",
        current: topCat?.key ?? "—",
        delta: topCat?.key !== prevTopCat?.key ? "↑" : "→",
        deltaPositive: topCat?.key !== prevTopCat?.key,
      },
    ];

    // 3.3 Records
    const records: RecordItem[] = [];
    if (timeline?.points.length) {
      const firstPoint = timeline.points[0];
      if (!firstPoint) return null;

      let bestDay = firstPoint;
      let worstDay = firstPoint;

      for (const p of timeline.points) {
        const totalP = Object.values(p.counts).reduce((s, c) => s + c, 0);
        const bestTotal = Object.values(bestDay.counts).reduce((s, c) => s + c, 0);
        const worstTotal = Object.values(worstDay.counts).reduce((s, c) => s + c, 0);
        const posP = p.counts["positive"] ?? 0;
        const bestPos = bestDay.counts["positive"] ?? 0;
        const negP = p.counts["negative"] ?? 0;
        const worstNeg = worstDay.counts["negative"] ?? 0;

        if (totalP > 0 && posP / totalP > bestPos / bestTotal) bestDay = p;
        if (totalP > 0 && negP / totalP > worstNeg / worstTotal) worstDay = p;
      }
      const bestDate = new Date(bestDay.bucket).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
      const worstDate = new Date(worstDay.bucket).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
      records.push({
        type: "best",
        label: `Лучший день: ${bestDate}`,
        value: `${pct(
          bestDay.counts["positive"] ?? 0,
          Object.values(bestDay.counts).reduce((s, c) => s + c, 0),
        )}% позитивных`,
      });
      records.push({
        type: "worst",
        label: `Худший день: ${worstDate}`,
        value: `${pct(
          worstDay.counts["negative"] ?? 0,
          Object.values(worstDay.counts).reduce((s, c) => s + c, 0),
        )}% негативных`,
      });
    }

    if (categories.buckets.length) {
      const bestCat = [...categories.buckets].sort((a, b) => b.count - a.count)[0];
      if (bestCat) {
        records.push({
          type: "negative",
          label: "Самая проблемная категория",
          value: `${bestCat.key} (${bestCat.count})`,
        });
      }
      if (categories.buckets.length > 1) {
        const leastCat = [...categories.buckets].sort((a, b) => a.count - b.count)[0];
        if (leastCat) {
          records.push({
            type: "positive",
            label: "Наименьшая категория",
            value: `${leastCat.key} (${leastCat.count})`,
          });
        }
      }
    }

    // 3.4 Top categories
    const topCategories: TopCategory[] = [...categories.buckets]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((b) => {
        const prevBucket = prevCategories.buckets.find((pb) => pb.key === b.key);
        const trend = prevBucket ? b.count - prevBucket.count : 0;
        return { name: b.key, count: b.count, percent: pct(b.count, total), trend };
      });

    // 3.5 Hourly
    const hourly: HourlyData[] = (hourlyTimeline?.points ?? []).map((p) => ({
      hour: new Date(p.bucket).getHours(),
      count: p.counts["negative"] ?? 0,
    }));

    // 3.6 Anomalies
    const anomalies: AnomalyItem[] = [];
    if (timeline?.points.length) {
      const avgNeg = neg / timeline.points.length;
      for (const p of timeline.points) {
        const negCount = p.counts["negative"] ?? 0;
        if (negCount > avgNeg * 2 && negCount > 2) {
          const date = new Date(p.bucket).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
          });
          anomalies.push({
            date,
            description: `${negCount} негативных обращений при среднем ${Math.round(avgNeg)}`,
          });
        }
      }
    }

    // 3.7 Conclusion
    const conclusion = `За ${current.label.toLowerCase()} наблюдается ${negDelta < 0 ? "снижение" : "рост"} негативных обращений на ${Math.abs(negDelta)} %. Основная проблема — ${topCat?.key ?? "—"} (${topCat?.count ?? 0} обращений${topCat && prevTopCat ? `, ${topCat.count > (prevTopCat?.count ?? 0) ? "рост" : "снижение"} на ${Math.abs(topCat.count - (prevTopCat?.count ?? 0))}` : ""}). ${anomalies.length ? `Аномальный день — ${anomalies?.length ? (anomalies[0]?.date ?? "") : ""}.` : ""}`;

    return {
      period,
      range: current,
      statsLineData,
      comparison,
      records,
      topCategories,
      hourly,
      anomalies,
      conclusion,
    };
  }, [
    period,
    sentiment,
    prevSentiment,
    categories,
    prevCategories,
    timeline,
    hourlyTimeline,
    current,
  ]);
};
