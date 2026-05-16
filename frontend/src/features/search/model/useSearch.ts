import type { SearchFilters } from "@/features/search/model/search.types";
import { analyticsApi, endpoints } from "@/shared/api";
import type { SearchResponse } from "@/shared/types/api";
import { useQuery } from "@tanstack/react-query";

export const useSearch = (filters: SearchFilters) => {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: () =>
      analyticsApi.get<SearchResponse>(endpoints.search.list, {
        params: {
          q: filters.q || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          page: filters.page,
          size: filters.size,
        },
      }),
    placeholderData: (prev) => prev,
  });
};
