import { api, endpoints } from "@/shared/api";
import type { SearchResponse } from "@/shared/types/api";
import { useQuery } from "@tanstack/react-query";

export const useRecentCalls = (size = 5) => {
  return useQuery({
    queryKey: ["messages", "recent", size],
    queryFn: () =>
      api.get<SearchResponse>(endpoints.search.list, {
        params: { size, page: 1 },
      }),
    staleTime: 30 * 1000,
  });
};
