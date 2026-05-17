export type SummaryPeriod = "today" | "week" | "month" | "quarter" | "year";

export interface PeriodRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  label: string;
  prevLabel: string;
}

export interface ComparisonRow {
  label: string;
  prev: string;
  current: string;
  delta: string;
  deltaPositive: boolean; // true = рост (зелёный), false = падение (красный), null = нейтрально
}

export interface RecordItem {
  type: "best" | "worst" | "positive" | "negative";
  label: string;
  value: string;
}

export interface AnomalyItem {
  date: string;
  description: string;
}

export interface TopCategory {
  name: string;
  count: number;
  percent: number;
  trend: number;
}

export interface HourlyData {
  hour: number;
  count: number;
}

export interface StatsLineData {
  total: number;
  posPct: number;
  negPct: number;
  negDelta: number;
  prevLabel: string;
  topCategory: string;
  topCategoryCount: number;
}

export interface SummaryData {
  period: SummaryPeriod;
  range: PeriodRange;
  // 3.1
  statsLineData: StatsLineData;
  // 3.2
  comparison: ComparisonRow[];
  // 3.3
  records: RecordItem[];
  // 3.4
  topCategories: TopCategory[];
  // 3.5
  hourly: HourlyData[];
  // 3.6
  anomalies: AnomalyItem[];
  // 3.7
  conclusion: string;
}
