import { api, endpoints } from "@/shared/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface UserItem {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

export interface UserWithCategories extends UserItem {
  categories: Array<{
    id: number;
    code: string;
    name: string;
    domain: string;
  }>;
}

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<{ users: UserItem[] }>(endpoints.admin.users),
    staleTime: 2 * 60 * 1000,
  });
};

export const useUserDetail = (id: string) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => api.get<UserWithCategories>(endpoints.admin.userDetail(id)),
    enabled: Boolean(id),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; password: string; role?: string }) =>
      api.post(endpoints.admin.users, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
