// Analytics API: read-side service for the diplom pipeline.
//
// Endpoints (all under /api/v1, JSON):
//   GET /search?q=&user_id=&from=&to=&page=&size= — full-text + filters via Elasticsearch
//   GET /messages/{id}                            — joined details from PostgreSQL
//   GET /stats/sentiment?user_id=&from=&to=       — terms agg on sentiment.label
//   GET /stats/categories?user_id=&from=&to=      — terms agg on category.category
//   GET /stats/timeline?bucket=hour|day&metric=sentiment|category&user_id=&from=&to=
//
// Admin-only: every /api/v1 endpoint requires a JWT with role=admin. The
// optional user_id query param scopes results to one user's appeals.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/1rate/diplom/pkg/auth"
	"github.com/1rate/diplom/pkg/config"
	"github.com/1rate/diplom/pkg/esstore"
	"github.com/1rate/diplom/pkg/logging"
	"github.com/1rate/diplom/pkg/miniostore"
	"github.com/1rate/diplom/pkg/pgstore"
	"github.com/1rate/diplom/pkg/version"
)

const presignTTL = 15 * time.Minute

func main() {
	log := logging.New("analytics")
	log.Info("starting", "version", version.Version)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pg, err := pgstore.Connect(ctx, config.MustGet("POSTGRES_DSN"))
	if err != nil {
		log.Error("pg connect", "err", err)
		os.Exit(1)
	}
	defer pg.Close()

	es := esstore.New(
		config.Get("ELASTICSEARCH_URL", "http://localhost:9200"),
		config.Get("ELASTICSEARCH_INDEX", "messages"),
	)

	// MinIO client used only to mint presigned GET URLs for audio. We pass the
	// browser-reachable endpoint (MINIO_PUBLIC_ENDPOINT) so the URL host is correct;
	// no actual S3 calls happen from analytics.
	mn, err := miniostore.Connect(
		config.Get("MINIO_PUBLIC_ENDPOINT", config.MustGet("MINIO_ENDPOINT")),
		config.MustGet("MINIO_ACCESS_KEY"),
		config.MustGet("MINIO_SECRET_KEY"),
		config.Get("MINIO_BUCKET", "diplom-audio"),
		config.Get("MINIO_USE_SSL", "false") == "true",
	)
	if err != nil {
		log.Error("minio connect", "err", err)
		os.Exit(1)
	}

	h := &handler{log: log, pg: pg, es: es, mn: mn}

	adminMW := auth.Middleware(config.MustGet("JWT_SECRET"), true)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.healthz)
	mux.Handle("GET /api/v1/search", adminMW(http.HandlerFunc(h.search)))
	mux.Handle("GET /api/v1/messages/{id}", adminMW(http.HandlerFunc(h.getMessage)))
	mux.Handle("GET /api/v1/stats/sentiment", adminMW(http.HandlerFunc(h.statsSentiment)))
	mux.Handle("GET /api/v1/stats/categories", adminMW(http.HandlerFunc(h.statsCategories)))
	mux.Handle("GET /api/v1/stats/timeline", adminMW(http.HandlerFunc(h.statsTimeline)))

	srv := &http.Server{
		Addr:              config.Get("ANALYTICS_HTTP_ADDR", ":8081"),
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Info("http listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("http serve", "err", err)
			stop()
		}
	}()

	<-ctx.Done()
	log.Info("shutting down")

	shutCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutCtx)
	log.Info("bye")
}

type handler struct {
	log *slog.Logger
	pg  *pgstore.Store
	es  *esstore.Store
	mn  *miniostore.Store
}

func (h *handler) healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *handler) search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	from, err := parseTime(q.Get("from"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid 'from': "+err.Error())
		return
	}
	to, err := parseTime(q.Get("to"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid 'to': "+err.Error())
		return
	}
	page := parseInt(q.Get("page"), 1)
	size := parseInt(q.Get("size"), 20)
	if size > 100 {
		size = 100
	}

	res, err := h.es.Search(r.Context(), esstore.SearchParams{
		Query: q.Get("q"), UserID: q.Get("user_id"),
		From: from, To: to, Page: page, Size: size,
	})
	if err != nil {
		h.log.Error("es search", "err", err)
		writeError(w, http.StatusBadGateway, "search backend error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"total": res.Total,
		"page":  page,
		"size":  size,
		"items": res.Hits,
	})
}

func (h *handler) getMessage(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "missing id")
		return
	}
	d, err := h.pg.GetMessage(r.Context(), id)
	if errors.Is(err, pgstore.ErrNotFound) {
		writeError(w, http.StatusNotFound, "message not found")
		return
	}
	if err != nil {
		h.log.Error("pg get", "err", err, "id", id)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}

	out := messageToJSON(d)
	if d.AudioObject != "" {
		if u, err := h.mn.PresignGet(r.Context(), d.AudioObject, presignTTL); err == nil {
			out["audio_url"] = u
		} else {
			h.log.Error("presign", "err", err, "key", d.AudioObject)
		}
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *handler) statsSentiment(w http.ResponseWriter, r *http.Request) {
	h.statsTerms(w, r, "sentiment.label")
}

func (h *handler) statsCategories(w http.ResponseWriter, r *http.Request) {
	h.statsTerms(w, r, "category.category")
}

func (h *handler) statsTerms(w http.ResponseWriter, r *http.Request, field string) {
	q := r.URL.Query()
	from, err := parseTime(q.Get("from"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid 'from'")
		return
	}
	to, err := parseTime(q.Get("to"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid 'to'")
		return
	}
	buckets, err := h.es.AggTerms(r.Context(), field, q.Get("user_id"), from, to)
	if err != nil {
		h.log.Error("es agg", "err", err, "field", field)
		writeError(w, http.StatusBadGateway, "stats backend error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"buckets": buckets})
}

func (h *handler) statsTimeline(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	bucket := q.Get("bucket")
	if bucket == "" {
		bucket = "day"
	}
	if bucket != "hour" && bucket != "day" {
		writeError(w, http.StatusBadRequest, "bucket must be 'hour' or 'day'")
		return
	}

	metric := q.Get("metric")
	if metric == "" {
		metric = "sentiment"
	}
	var subField string
	switch metric {
	case "sentiment":
		subField = "sentiment.label"
	case "category":
		subField = "category.category"
	default:
		writeError(w, http.StatusBadRequest, "metric must be 'sentiment' or 'category'")
		return
	}

	from, err := parseTime(q.Get("from"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid 'from'")
		return
	}
	to, err := parseTime(q.Get("to"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid 'to'")
		return
	}

	points, err := h.es.AggTimeline(r.Context(), bucket, subField, q.Get("user_id"), from, to)
	if err != nil {
		h.log.Error("es timeline", "err", err)
		writeError(w, http.StatusBadGateway, "stats backend error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"bucket": bucket,
		"metric": metric,
		"points": points,
	})
}

func messageToJSON(d *pgstore.MessageDetails) map[string]any {
	out := map[string]any{
		"id":          d.ID,
		"source":      d.Source,
		"status":      d.Status,
		"text":        d.Text,
		"received_at": d.ReceivedAt,
		"updated_at":  d.UpdatedAt,
	}
	if d.UserID != "" {
		out["user_id"] = d.UserID
	}
	if d.AudioObject != "" {
		out["audio_object"] = d.AudioObject
	}
	if d.Sentiment != nil {
		out["sentiment"] = map[string]any{
			"label":         d.Sentiment.Label,
			"score":         d.Sentiment.Score,
			"model_version": d.Sentiment.ModelVersion,
		}
	}
	if d.Category != nil {
		out["category"] = map[string]any{
			"category":      d.Category.Category,
			"score":         d.Category.Score,
			"model_version": d.Category.ModelVersion,
		}
	}
	return out
}

func parseTime(s string) (*time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func parseInt(s string, fallback int) int {
	if s == "" {
		return fallback
	}
	n, err := strconv.Atoi(s)
	if err != nil || n < 1 {
		return fallback
	}
	return n
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
