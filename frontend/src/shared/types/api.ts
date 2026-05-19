// ============================================
// Общие
// ============================================

export interface ApiError {
  error: string;
}

// ============================================
// Аутентификация
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  role: "user" | "admin";
  created_at: string;
}

// ============================================
// Категории (справочник)
// ============================================

export interface CategoryItem {
  id: number;
  code: string;
  name: string;
  domain: string;
}

export interface CategoryCatalog {
  categories: CategoryItem[];
}

// ============================================
// Админка
// ============================================

export interface CreateUserRequest {
  username: string;
  password: string;
  role?: "user" | "admin";
}

export interface UserWithCategories extends User {
  categories: CategoryItem[];
}

export interface AssignCategoriesRequest {
  category_ids: number[];
}

// ============================================
// Ingest
// ============================================

export type MessageSource = "text" | "audio";

export interface IngestResponse {
  message_id: string;
  status: "pending";
}

// ============================================
// Сущности
// ============================================

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface Sentiment {
  label: SentimentLabel;
  score: number;
  model_version: string;
}

export interface Category {
  category: string;
  score: number;
  model_version: string;
}

// ============================================
// Индексированное сообщение (из /search)
// ============================================

export interface IndexedMessage {
  message_id: string;
  user_id?: string;
  source: MessageSource;
  text: string;
  received_at: string;
  sentiment?: Sentiment;
  category?: Category;
}

export interface SearchResponse {
  total: number;
  page: number;
  size: number;
  items: IndexedMessage[];
}

export interface SearchParams {
  q?: string;
  user_id?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

// ============================================
// Детализация сообщения (из /messages/:id)
// ============================================

export type MessageStatus = "pending" | "transcribed" | "enriched" | "failed";

export interface MessageDetails {
  id: string;
  user_id?: string;
  source: MessageSource;
  status: MessageStatus;
  text: string;
  audio_object?: string;
  audio_url?: string;
  received_at: string;
  updated_at: string;
  sentiment?: Sentiment;
  category?: Category;
}

// ============================================
// Агрегации (статистика)
// ============================================

export interface AggBucket {
  key: string;
  count: number;
}

export interface TermsAggregation {
  buckets: AggBucket[];
}

export interface TimelinePoint {
  bucket: string;
  total: number;
  counts: Record<string, number>;
}

export interface Timeline {
  bucket: "hour" | "day";
  metric: "sentiment" | "category";
  points: TimelinePoint[];
}

export type StatsBucket = "hour" | "day";
export type StatsMetric = "sentiment" | "category";
