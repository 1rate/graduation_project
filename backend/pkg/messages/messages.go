// Package messages defines wire-format DTOs for inter-service messages
// (NATS JetStream) and the well-known stream/subject/stage constants.
package messages

import "time"

// Stage names used as keys in the processed_messages table for idempotency (Phase 6).
const (
	StageSTT       = "stt"
	StageSentiment = "sentiment"
	StageCategory  = "category"
	StageIndexer   = "indexer"
)

// JetStream stream names. Stream names cannot contain dots.
const (
	StreamRaw      = "MESSAGES_RAW"
	StreamText     = "MESSAGES_TEXT"
	StreamEnriched = "MESSAGES_ENRICHED"
)

// JetStream subjects. Subjects can contain dots.
const (
	SubjectRaw      = "messages.raw"
	SubjectText     = "messages.text"
	SubjectEnriched = "messages.enriched"
)

// Durable consumer names — one per (service × stream).
const (
	ConsumerSTT             = "stt-worker"
	ConsumerSentiment       = "sentiment-worker"
	ConsumerCategory        = "category-worker"
	ConsumerIndexerText     = "indexer-text"
	ConsumerIndexerEnriched = "indexer-enriched"
)

// Source describes the origin of a user appeal.
type Source string

const (
	SourceText  Source = "text"
	SourceAudio Source = "audio"
)

// Status describes the pipeline progress of a message in PostgreSQL.
type Status string

const (
	StatusPending     Status = "pending"
	StatusTranscribed Status = "transcribed"
	StatusEnriched    Status = "enriched"
	StatusFailed      Status = "failed"
)

// CategoryNone is the label assigned when the classifier is not confident
// enough that an appeal belongs to any category assigned to its user.
const CategoryNone = "без категории"

// RawMessage is published to SubjectRaw by Ingest API.
type RawMessage struct {
	MessageID   string    `json:"message_id"`
	UserID      string    `json:"user_id"`
	Source      Source    `json:"source"`
	Text        string    `json:"text,omitempty"`
	AudioObject string    `json:"audio_object,omitempty"`
	ReceivedAt  time.Time `json:"received_at"`
}

// TextMessage is published to SubjectText after STT (or pass-through for text source).
type TextMessage struct {
	MessageID      string    `json:"message_id"`
	UserID         string    `json:"user_id"`
	Text           string    `json:"text"`
	OriginalSource Source    `json:"original_source"`
	ReceivedAt     time.Time `json:"received_at"`
}

// SentimentResult — partial enrichment payload for a single message.
type SentimentResult struct {
	MessageID    string  `json:"message_id"`
	Label        string  `json:"label"` // "positive" | "neutral" | "negative"
	Score        float32 `json:"score"`
	ModelVersion string  `json:"model_version"`
}

// CategoryResult — partial enrichment payload for a single message.
type CategoryResult struct {
	MessageID    string  `json:"message_id"`
	Category     string  `json:"category"`
	Score        float32 `json:"score"`
	ModelVersion string  `json:"model_version"`
}

// EnrichedPart wraps either a sentiment or a category result.
// Exactly one of Sentiment/Category is set; Kind tells which.
type EnrichedPart struct {
	Kind      string           `json:"kind"`
	Sentiment *SentimentResult `json:"sentiment,omitempty"`
	Category  *CategoryResult  `json:"category,omitempty"`
}

const (
	KindSentiment = "sentiment"
	KindCategory  = "category"
)
