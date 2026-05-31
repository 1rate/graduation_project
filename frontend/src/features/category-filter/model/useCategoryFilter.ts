import { categoryApi } from "@/features/category-filter/model/category.store";
import { tokenStorage } from "@/shared/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function parseJwt(token: string): { sub?: string } | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload ?? ""));
  } catch {
    return null;
  }
}

const getUserId = (): string | null => {
  const token = tokenStorage.getAccessToken();
  if (!token) return null;
  const jwt = parseJwt(token);
  return jwt?.sub ?? null;
};

export const useCategoryCatalog = () => {
  return useQuery({
    queryKey: ["categories", "catalog"],
    queryFn: categoryApi.getCatalog,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUserCategories = () => {
  const userId = getUserId();

  return useQuery({
    queryKey: ["categories", "user", userId],
    queryFn: () => categoryApi.getUserWithCategories(userId!),
    enabled: Boolean(userId),
  });
};

export const useSetUserCategories = () => {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (categoryIds: number[]) => categoryApi.setUserCategories(userId!, categoryIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", "user", userId] });
    },
  });
};
