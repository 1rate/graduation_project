// ============================================
// Общие
// ============================================

export interface ApiError {
  error: string;
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
