export interface MetricData {
  label: string;
  value: number;
  countValue: number;
  format?: "number" | "percent";
}

export interface MetricsData {
  total: MetricData;
  positive: MetricData;
  neutral: MetricData;
  negative: MetricData;
}
