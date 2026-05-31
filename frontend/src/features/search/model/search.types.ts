export interface SearchFiltersProps {
  q: string;
  from: string;
  to: string;
  page: number;
  size: number;
  localSentiment?: string;
  localCategory?: string;
}
