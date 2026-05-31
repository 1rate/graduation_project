package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nats-io/nats.go/jetstream"

	"github.com/1rate/diplom/pkg/config"
	"github.com/1rate/diplom/pkg/esstore"
	"github.com/1rate/diplom/pkg/logging"
	"github.com/1rate/diplom/pkg/messages"
	"github.com/1rate/diplom/pkg/natsx"
	"github.com/1rate/diplom/pkg/version"
)

// Indexer subscribes to two streams:
//   - messages.text     — populates the ES doc with text + source + received_at
//   - messages.enriched — adds sentiment / category fields as they arrive
//
// ES upsert (doc_as_upsert=true) handles partial state: events from either stream
// can arrive in any order, and the final document converges.

func main() {
	log := logging.New("indexer")
	log.Info("starting", "version", version.Version)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	es := esstore.New(
		config.Get("ELASTICSEARCH_URL", "http://localhost:9200"),
		config.Get("ELASTICSEARCH_INDEX", "messages"),
	)
	if err := es.EnsureIndex(ctx); err != nil {
		log.Error("ensure es index", "err", err)
		os.Exit(1)
	}

	nc, err := natsx.Connect(config.MustGet("NATS_URL"))
	if err != nil {
		log.Error("nats connect", "err", err)
		os.Exit(1)
	}
	defer nc.Close()

	if err := nc.EnsureStream(ctx, messages.StreamText, []string{messages.SubjectText}); err != nil {
		log.Error("ensure text stream", "err", err)
		os.Exit(1)
	}
	if err := nc.EnsureStream(ctx, messages.StreamEnriched, []string{messages.SubjectEnriched}); err != nil {
		log.Error("ensure enriched stream", "err", err)
		os.Exit(1)
	}

	textCons, err := nc.EnsureConsumer(ctx, messages.StreamText, messages.ConsumerIndexerText, messages.SubjectText)
	if err != nil {
		log.Error("ensure text consumer", "err", err)
		os.Exit(1)
	}
	enrCons, err := nc.EnsureConsumer(ctx, messages.StreamEnriched, messages.ConsumerIndexerEnriched, messages.SubjectEnriched)
	if err != nil {
		log.Error("ensure enriched consumer", "err", err)
		os.Exit(1)
	}

	h := &handler{log: log, es: es}

	textCC, err := textCons.Consume(h.handleText)
	if err != nil {
		log.Error("consume text", "err", err)
		os.Exit(1)
	}
	defer textCC.Stop()

	enrCC, err := enrCons.Consume(h.handleEnriched)
	if err != nil {
		log.Error("consume enriched", "err", err)
		os.Exit(1)
	}
	defer enrCC.Stop()

	log.Info("consuming", "streams", []string{messages.StreamText, messages.StreamEnriched})
	<-ctx.Done()
	log.Info("shutting down")
}

type handler struct {
	log *slog.Logger
	es  *esstore.Store
}

func (h *handler) handleText(msg jetstream.Msg) {
	var tm messages.TextMessage
	if err := json.Unmarshal(msg.Data(), &tm); err != nil {
		h.log.Error("text: bad payload, terminating", "err", err)
		_ = msg.Term()
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	fields := map[string]any{
		"message_id":  tm.MessageID,
		"user_id":     tm.UserID,
		"text":        tm.Text,
		"source":      string(tm.OriginalSource),
		"received_at": tm.ReceivedAt,
	}
	if err := h.es.Upsert(ctx, tm.MessageID, fields); err != nil {
		h.log.Error("text: es upsert", "err", err, "message_id", tm.MessageID)
		_ = msg.Nak()
		return
	}

	h.log.Info("indexed text", "message_id", tm.MessageID)
	_ = msg.Ack()
}

func (h *handler) handleEnriched(msg jetstream.Msg) {
	var part messages.EnrichedPart
	if err := json.Unmarshal(msg.Data(), &part); err != nil {
		h.log.Error("enriched: bad payload, terminating", "err", err)
		_ = msg.Term()
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var id string
	var fields map[string]any
	switch part.Kind {
	case messages.KindSentiment:
		if part.Sentiment == nil {
			h.log.Error("enriched: sentiment kind with nil payload, terminating")
			_ = msg.Term()
			return
		}
		id = part.Sentiment.MessageID
		fields = map[string]any{
			"sentiment": map[string]any{
				"label":         part.Sentiment.Label,
				"score":         part.Sentiment.Score,
				"model_version": part.Sentiment.ModelVersion,
			},
		}
	case messages.KindCategory:
		if part.Category == nil {
			h.log.Error("enriched: category kind with nil payload, terminating")
			_ = msg.Term()
			return
		}
		id = part.Category.MessageID
		fields = map[string]any{
			"category": map[string]any{
				"category":      part.Category.Category,
				"score":         part.Category.Score,
				"model_version": part.Category.ModelVersion,
			},
		}
	default:
		h.log.Error("enriched: unknown kind, terminating", "kind", part.Kind)
		_ = msg.Term()
		return
	}

	if err := h.es.Upsert(ctx, id, fields); err != nil {
		h.log.Error("enriched: es upsert", "err", err, "message_id", id, "kind", part.Kind)
		_ = msg.Nak()
		return
	}

	h.log.Info("indexed enriched", "message_id", id, "kind", part.Kind)
	_ = msg.Ack()
}
