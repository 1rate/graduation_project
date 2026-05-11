export interface SentimentBucket {
  key: string;
  count: number;
}

export interface SentimentData {
  buckets: SentimentBucket[];
}
