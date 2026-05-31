package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/google/uuid"

	"github.com/1rate/diplom/pkg/auth"
	"github.com/1rate/diplom/pkg/config"
	"github.com/1rate/diplom/pkg/logging"
	"github.com/1rate/diplom/pkg/messages"
	"github.com/1rate/diplom/pkg/miniostore"
	"github.com/1rate/diplom/pkg/natsx"
	"github.com/1rate/diplom/pkg/pgstore"
	"github.com/1rate/diplom/pkg/version"
)

const maxAudioBytes = 50 << 20 // 50 MiB

func main() {
	log := logging.New("ingest")
	log.Info("starting", "version", version.Version)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pg, err := pgstore.Connect(ctx, config.MustGet("POSTGRES_DSN"))
	if err != nil {
		log.Error("pg connect failed", "err", err)
		os.Exit(1)
	}
	defer pg.Close()

	nc, err := natsx.Connect(config.MustGet("NATS_URL"))
	if err != nil {
		log.Error("nats connect failed", "err", err)
		os.Exit(1)
	}
	defer nc.Close()

	if err := nc.EnsureStream(ctx, messages.StreamRaw, []string{messages.SubjectRaw}); err != nil {
		log.Error("ensure raw stream", "err", err)
		os.Exit(1)
	}

	mn, err := miniostore.Connect(
		config.MustGet("MINIO_ENDPOINT"),
		config.MustGet("MINIO_ACCESS_KEY"),
		config.MustGet("MINIO_SECRET_KEY"),
		config.Get("MINIO_BUCKET", "diplom-audio"),
		config.Get("MINIO_USE_SSL", "false") == "true",
	)
	if err != nil {
		log.Error("minio connect", "err", err)
		os.Exit(1)
	}
	if err := mn.EnsureBucket(ctx); err != nil {
		log.Error("ensure bucket", "err", err)
		os.Exit(1)
	}

	h := &handler{log: log, pg: pg, nc: nc, mn: mn}

	// Any authenticated user (admin or user) may submit appeals; user_id comes
	// from the verified JWT, not from the request body.
	requireAuth := auth.Middleware(config.MustGet("JWT_SECRET"), false)

	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/messages", requireAuth(http.HandlerFunc(h.create)))
	mux.HandleFunc("GET /healthz", h.healthz)

	srv := &http.Server{
		Addr:              config.Get("INGEST_HTTP_ADDR", ":8080"),
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
	nc  *natsx.Client
	mn  *miniostore.Store
}

func (h *handler) create(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.FromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "missing authentication")
		return
	}
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid user id in token")
		return
	}

	if err := r.ParseMultipartForm(maxAudioBytes); err != nil {
		writeError(w, http.StatusBadRequest, "parse multipart: "+err.Error())
		return
	}

	sourceStr := r.FormValue("source")
	text := r.FormValue("text")

	var source messages.Source
	switch sourceStr {
	case "text":
		source = messages.SourceText
		if strings.TrimSpace(text) == "" {
			writeError(w, http.StatusBadRequest, "field 'text' is required for source=text")
			return
		}
	case "audio":
		source = messages.SourceAudio
	default:
		writeError(w, http.StatusBadRequest, "field 'source' must be 'text' or 'audio'")
		return
	}

	id := uuid.New()
	var audioObject string

	if source == messages.SourceAudio {
		file, header, err := r.FormFile("audio")
		if err != nil {
			writeError(w, http.StatusBadRequest, "field 'audio' file is required for source=audio")
			return
		}
		defer file.Close()

		ext := strings.ToLower(filepath.Ext(header.Filename))
		if ext == "" {
			ext = ".bin"
		}
		audioObject = id.String() + ext
		contentType := header.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "application/octet-stream"
		}
		if err := h.mn.Put(r.Context(), audioObject, file, header.Size, contentType); err != nil {
			writeError(w, http.StatusInternalServerError, "store audio: "+err.Error())
			return
		}
	}

	if err := h.pg.InsertMessage(r.Context(), id, userID, source, audioObject, text); err != nil {
		writeError(w, http.StatusInternalServerError, "store message: "+err.Error())
		return
	}

	raw := messages.RawMessage{
		MessageID:   id.String(),
		UserID:      userID.String(),
		Source:      source,
		Text:        text,
		AudioObject: audioObject,
		ReceivedAt:  time.Now().UTC(),
	}
	payload, _ := json.Marshal(raw)
	if _, err := h.nc.JS.Publish(r.Context(), messages.SubjectRaw, payload); err != nil {
		writeError(w, http.StatusInternalServerError, "publish nats: "+err.Error())
		return
	}

	h.log.Info("message accepted", "message_id", id, "user_id", userID, "source", source)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message_id": id.String(),
		"status":     string(messages.StatusPending),
	})
}

func (h *handler) healthz(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = io.WriteString(w, "ok")
}

func writeError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
