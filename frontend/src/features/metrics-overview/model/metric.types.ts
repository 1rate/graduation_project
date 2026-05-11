export interface MetricData {
  label: string;
  value: number;
  previousValue: number;
  format?: "number" | "percent";
}

export interface MetricsData {
  total: MetricData;
  positive: MetricData;
  neutral: MetricData;
  negative: MetricData;
}
