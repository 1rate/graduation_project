import type { SearchFiltersProps } from "@/features/search/model/search.types";
import { api, endpoints } from "@/shared/api";
import { toRFC3339 } from "@/shared/lib/utils";
import type { IndexedMessage, SearchResponse } from "@/shared/types/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const useSearch = (filters: SearchFiltersProps) => {
  const query = useQuery({
    queryKey: ["search", filters],
    queryFn: () =>
      api.get<SearchResponse>(endpoints.search.list, {
        params: {
          q: filters.q || undefined,
          from: toRFC3339(filters.from),
          to: toRFC3339(filters.to, true),
          page: filters.page,
          size: filters.size,
        },
      }),
    placeholderData: (prev) => prev,
  });

  const filteredItems = useMemo(() => {
    if (!query.data?.items) return [];
    let items: IndexedMessage[] = query.data.items;

    if (filters.localSentiment) {
      items = items.filter((item) => item.sentiment?.label === filters.localSentiment);
    }

    if (filters.localCategory) {
      items = items.filter((item) =>
        item.category?.category?.toLowerCase().includes(filters.localCategory!.toLowerCase()),
      );
    }

    return items;
  }, [query.data?.items, filters.localSentiment, filters.localCategory]);

  return {
    ...query,
    data: query.data ? { ...query.data, items: filteredItems } : undefined,
  };
};
