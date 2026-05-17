import { analyticsApi, endpoints } from "@/shared/api";
import { toRFC3339 } from "@/shared/lib/utils";
import type { TermsAggregation } from "@/shared/types/api";
import { useQuery } from "@tanstack/react-query";

export const useCategoriesStats = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ["stats", "categories", from, to],
    queryFn: () =>
      analyticsApi.get<TermsAggregation>(endpoints.stats.categories, {
        params: {
          from: toRFC3339(from),
          to: toRFC3339(to, true),
        },
      }),
    staleTime: 5 * 60 * 1000,
  });
};
