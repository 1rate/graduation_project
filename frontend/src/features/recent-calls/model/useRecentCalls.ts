import { useQuery } from "@tanstack/react-query";
import { analyticsApi, endpoints } from "@/shared/api";
import type { SearchResponse } from "@/shared/types/api";

export const useRecentCalls = (size = 5) => {
  return useQuery({
    queryKey: ["messages", "recent", size],
    queryFn: () =>
      analyticsApi.get<SearchResponse>(endpoints.search.list, {
        params: { size, page: 1 },
      }),
    staleTime: 30 * 1000,
  });
};
