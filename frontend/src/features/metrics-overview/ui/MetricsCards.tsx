import { useMetrics } from "@/features/metrics-overview/model/useMetrics";
import { MetricCard } from "@/features/metrics-overview/ui/MetricCard";
import { DatePickerClearable } from "@/shared/components/DatePicker";
import { getCurrentWeekRange } from "@/shared/lib/utils";
import { useCallback, useMemo, useState } from "react";

interface MetricsCardsProps {
  from?: string;
  to?: string;
  onFromChange?: (from: string) => void;
  onToChange?: (to: string) => void;
}

export const MetricsCards = ({
  from: externalFrom,
  to: externalTo,
  onFromChange,
  onToChange,
}: MetricsCardsProps) => {
  const defaultRange = useMemo(() => getCurrentWeekRange(), []);
  const [localFrom, setLocalFrom] = useState(externalFrom ?? defaultRange.from);
  const [localTo, setLocalTo] = useState(externalTo ?? defaultRange.to);

  const from = externalFrom ?? localFrom;
  const to = externalTo ?? localTo;
  const metrics = useMetrics(from, to);

  const handleFromChange = useCallback(
    (val: string) => {
      setLocalFrom(val);
      onFromChange?.(val);
    },
    [onFromChange],
  );

  const handleToChange = useCallback(
    (val: string) => {
      setLocalTo(val);
      onToChange?.(val);
    },
    [onToChange],
  );

  if (!metrics) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <DatePickerClearable value={from} onChange={handleFromChange} placeholder="С" />
        <span className="text-muted-foreground">—</span>
        <DatePickerClearable value={to} onChange={handleToChange} placeholder="По" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard metric={metrics.total} />
        <MetricCard metric={metrics.positive} variant="positive" />
        <MetricCard metric={metrics.neutral} variant="neutral" />
        <MetricCard metric={metrics.negative} variant="negative" />
      </div>
    </div>
  );
};
