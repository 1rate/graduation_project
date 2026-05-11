import { useQuery } from "@tanstack/react-query";
import { analyticsApi, endpoints } from "@/shared/api";
import type { TermsAggregation } from "@/shared/types/api";

export const useSentimentStats = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ["stats", "sentiment", from, to],
    queryFn: () =>
      analyticsApi.get<TermsAggregation>(endpoints.stats.sentiment, {
        params: { from, to },
      }),
    staleTime: 5 * 60 * 1000,
  });
};
