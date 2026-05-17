import { analyticsApi, endpoints } from "@/shared/api";
import { toRFC3339 } from "@/shared/lib/utils";
import type { StatsBucket, StatsMetric, Timeline } from "@/shared/types/api";
import { useQuery } from "@tanstack/react-query";

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
        params: {
          bucket,
          metric,
          from: toRFC3339(from),
          to: toRFC3339(to, true),
        },
      }),
    staleTime: 5 * 60 * 1000,
  });
};
