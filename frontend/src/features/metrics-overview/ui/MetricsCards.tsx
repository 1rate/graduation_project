import { useMetrics } from "@/features/metrics-overview/model/useMetrics";
import { MetricCard } from "@/features/metrics-overview/ui/MetricCard";

interface MetricsCardsProps {
  from?: string;
  to?: string;
}

export const MetricsCards = ({ from, to }: MetricsCardsProps) => {
  const metrics = useMetrics(from, to);

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-4">
      <MetricCard metric={metrics.total} />
      <MetricCard metric={metrics.positive} variant="positive" />
      <MetricCard metric={metrics.neutral} variant="neutral" />
      <MetricCard metric={metrics.negative} variant="negative" />
    </div>
  );
};
