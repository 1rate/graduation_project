export interface SearchFilters {
  q: string;
  from: string;
  to: string;
  page: number;
  size: number;
  localSentiment?: string;
  localCategory?: string;
}
