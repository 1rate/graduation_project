import { api, endpoints } from "@/shared/api";
import type { MessageDetails } from "@/shared/types/api";
import { useQuery } from "@tanstack/react-query";

export const useCallDetail = (id: string) => {
  return useQuery({
    queryKey: ["messages", "detail", id],
    queryFn: () => api.get<MessageDetails>(endpoints.search.detail(id)),
    enabled: Boolean(id),
  });
};
