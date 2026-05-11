import { useQuery } from "@tanstack/react-query";
import { analyticsApi, endpoints } from "@/shared/api";
import type { Timeline, StatsBucket, StatsMetric } from "@/shared/types/api";

export const useTimeline = (
  bucket: StatsBucket = "day",
  metric: StatsMetric = "sentiment",
  from?: string,
  to?: string,
) => {
  return useQuery({
    queryKey: ["stats", "timeline", bucket, metric, from, to],
    queryFn: () =>
      analyticsApi.get<Timeline>(endpoints.stats.timeline, {
        params: { bucket, metric, from, to },
      }),
    staleTime: 5 * 60 * 1000,
  });
};
