export interface CategoryItem {
  id: number;
  code: string;
  name: string;
  domain: string;
}

export interface CategoryCatalog {
  categories: CategoryItem[];
}
