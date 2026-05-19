import type {
  CategoryCatalog,
  CategoryItem,
} from "@/features/category-filter/model/category.types";
import { api, endpoints } from "@/shared/api";

export const categoryApi = {
  getCatalog: () => api.get<CategoryCatalog>(endpoints.categories),

  getUserWithCategories: (userId: string) =>
    api.get<{ id: string; categories: CategoryItem[] }>(endpoints.admin.userDetail(userId)),

  setUserCategories: (userId: string, categoryIds: number[]) =>
    api.put<{ id: string; categories: CategoryItem[] }>(endpoints.admin.userCategories(userId), {
      category_ids: categoryIds,
    }),
};
