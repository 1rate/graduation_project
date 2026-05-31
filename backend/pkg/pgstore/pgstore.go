// Package pgstore provides a thin PostgreSQL repository for diplom services.
package pgstore

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/1rate/diplom/pkg/messages"
)

// ErrNotFound is returned by GetMessage when the id does not exist.
var ErrNotFound = errors.New("message not found")

type Store struct {
	pool *pgxpool.Pool
}

func Connect(ctx context.Context, dsn string) (*Store, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("pg pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("pg ping: %w", err)
	}
	return &Store{pool: pool}, nil
}

func (s *Store) Close() { s.pool.Close() }

// InsertMessage records a freshly-received message with status=pending, owned
// by userID. audioObject and text may each be empty strings; empty values are
// stored as NULL.
func (s *Store) InsertMessage(ctx context.Context, id, userID uuid.UUID, source messages.Source, audioObject, text string) error {
	var audio, txt any
	if audioObject != "" {
		audio = audioObject
	}
	if text != "" {
		txt = text
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO messages (id, user_id, source, audio_object, text, status, received_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
		id, userID, string(source), audio, txt, string(messages.StatusPending),
	)
	return err
}

// SetTranscribed updates the message body and bumps status to "transcribed".
func (s *Store) SetTranscribed(ctx context.Context, id, text string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE messages SET text = $1, status = $2, updated_at = NOW() WHERE id = $3`,
		text, string(messages.StatusTranscribed), id,
	)
	return err
}

// UpsertSentiment inserts or replaces the sentiment result for a message.
func (s *Store) UpsertSentiment(ctx context.Context, r messages.SentimentResult) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO sentiment_results (message_id, label, score, model_version)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (message_id) DO UPDATE SET
			label = EXCLUDED.label,
			score = EXCLUDED.score,
			model_version = EXCLUDED.model_version,
			created_at = NOW()`,
		r.MessageID, r.Label, r.Score, r.ModelVersion,
	)
	return err
}

// MessageDetails is the joined view used by analytics /messages/{id}.
type MessageDetails struct {
	ID          string
	UserID      string
	Source      string
	Status      string
	Text        string
	AudioObject string
	ReceivedAt  time.Time
	UpdatedAt   time.Time

	Sentiment *messages.SentimentResult
	Category  *messages.CategoryResult
}

// GetMessage returns full details by id with optional sentiment / category attached.
// Returns ErrNotFound when the message does not exist.
func (s *Store) GetMessage(ctx context.Context, id string) (*MessageDetails, error) {
	const q = `
		SELECT m.id::text, COALESCE(m.user_id::text, ''), m.source, m.status,
		       COALESCE(m.text, ''), COALESCE(m.audio_object, ''),
		       m.received_at, m.updated_at,
		       s.label, s.score, s.model_version,
		       c.category, c.score, c.model_version
		FROM messages m
		LEFT JOIN sentiment_results s ON s.message_id = m.id
		LEFT JOIN category_results  c ON c.message_id = m.id
		WHERE m.id = $1`

	var d MessageDetails
	var sLabel, sModel, cCat, cModel *string
	var sScore, cScore *float32

	err := s.pool.QueryRow(ctx, q, id).Scan(
		&d.ID, &d.UserID, &d.Source, &d.Status, &d.Text, &d.AudioObject, &d.ReceivedAt, &d.UpdatedAt,
		&sLabel, &sScore, &sModel,
		&cCat, &cScore, &cModel,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("pg get message: %w", err)
	}

	if sLabel != nil {
		d.Sentiment = &messages.SentimentResult{
			MessageID: d.ID, Label: *sLabel, Score: *sScore, ModelVersion: *sModel,
		}
	}
	if cCat != nil {
		d.Category = &messages.CategoryResult{
			MessageID: d.ID, Category: *cCat, Score: *cScore, ModelVersion: *cModel,
		}
	}
	return &d, nil
}

// UpsertCategory inserts or replaces the category result for a message.
func (s *Store) UpsertCategory(ctx context.Context, r messages.CategoryResult) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO category_results (message_id, category, score, model_version)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (message_id) DO UPDATE SET
			category = EXCLUDED.category,
			score = EXCLUDED.score,
			model_version = EXCLUDED.model_version,
			created_at = NOW()`,
		r.MessageID, r.Category, r.Score, r.ModelVersion,
	)
	return err
}
