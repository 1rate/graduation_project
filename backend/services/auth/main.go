// Auth service: issues JWTs and hosts admin-only user/category management.
//
// Endpoints (all under /api/v1, JSON):
//   POST /auth/login                       — username+password → JWT
//   GET  /categories                       — fixed 30-category catalog (any role)
//   POST /admin/users                      — create a user (admin)
//   GET  /admin/users                      — list users (admin)
//   GET  /admin/users/{id}                 — user details + assigned categories (admin)
//   PUT  /admin/users/{id}/categories      — replace a user's assigned categories (admin)
//
// On startup an admin account is upserted from ADMIN_USERNAME / ADMIN_PASSWORD.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/google/uuid"

	"github.com/1rate/diplom/pkg/auth"
	"github.com/1rate/diplom/pkg/config"
	"github.com/1rate/diplom/pkg/logging"
	"github.com/1rate/diplom/pkg/pgstore"
	"github.com/1rate/diplom/pkg/version"
)

func main() {
	log := logging.New("auth")
	log.Info("starting", "version", version.Version)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pg, err := pgstore.Connect(ctx, config.MustGet("POSTGRES_DSN"))
	if err != nil {
		log.Error("pg connect", "err", err)
		os.Exit(1)
	}
	defer pg.Close()

	secret := config.MustGet("JWT_SECRET")
	tokenTTL := parseDuration(config.Get("AUTH_TOKEN_TTL", "24h"), 24*time.Hour)

	if err := bootstrapAdmin(ctx, pg); err != nil {
		log.Error("bootstrap admin", "err", err)
		os.Exit(1)
	}
	log.Info("admin account ensured", "username", config.MustGet("ADMIN_USERNAME"))

	h := &handler{log: log, pg: pg, secret: secret, tokenTTL: tokenTTL}

	adminMW := auth.Middleware(secret, true)
	authMW := auth.Middleware(secret, false)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.healthz)
	mux.HandleFunc("POST /api/v1/auth/login", h.login)
	mux.Handle("GET /api/v1/categories", authMW(http.HandlerFunc(h.listCategories)))
	mux.Handle("POST /api/v1/admin/users", adminMW(http.HandlerFunc(h.createUser)))
	mux.Handle("GET /api/v1/admin/users", adminMW(http.HandlerFunc(h.listUsers)))
	mux.Handle("GET /api/v1/admin/users/{id}", adminMW(http.HandlerFunc(h.getUser)))
	mux.Handle("PUT /api/v1/admin/users/{id}/categories", adminMW(http.HandlerFunc(h.setUserCategories)))

	srv := &http.Server{
		Addr:              config.Get("AUTH_HTTP_ADDR", ":8082"),
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

func bootstrapAdmin(ctx context.Context, pg *pgstore.Store) error {
	username := config.MustGet("ADMIN_USERNAME")
	password := config.MustGet("ADMIN_PASSWORD")
	hash, err := auth.HashPassword(password)
	if err != nil {
		return err
	}
	return pg.UpsertAdmin(ctx, username, hash)
}

func parseDuration(s string, fallback time.Duration) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return fallback
	}
	return d
}

type handler struct {
	log      *slog.Logger
	pg       *pgstore.Store
	secret   string
	tokenTTL time.Duration
}

func (h *handler) healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *handler) login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username and password are required")
		return
	}

	u, err := h.pg.GetUserByUsername(r.Context(), req.Username)
	if errors.Is(err, pgstore.ErrNotFound) || (err == nil && !auth.CheckPassword(u.PasswordHash, req.Password)) {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if err != nil {
		h.log.Error("login: pg lookup", "err", err)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}

	token, err := auth.IssueToken(h.secret, u.ID, u.Username, u.Role, h.tokenTTL)
	if err != nil {
		h.log.Error("login: issue token", "err", err)
		writeError(w, http.StatusInternalServerError, "could not issue token")
		return
	}
	h.log.Info("login ok", "user_id", u.ID, "role", u.Role)
	writeJSON(w, http.StatusOK, map[string]any{
		"token": token,
		"user":  userJSON(u),
	})
}

func (h *handler) createUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username and password are required")
		return
	}
	role := req.Role
	if role == "" {
		role = auth.RoleUser
	}
	if role != auth.RoleUser && role != auth.RoleAdmin {
		writeError(w, http.StatusBadRequest, "role must be 'user' or 'admin'")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		h.log.Error("create user: hash", "err", err)
		writeError(w, http.StatusInternalServerError, "could not hash password")
		return
	}
	id := uuid.New()
	err = h.pg.CreateUser(r.Context(), id, req.Username, hash, role)
	if errors.Is(err, pgstore.ErrUserExists) {
		writeError(w, http.StatusConflict, "username already exists")
		return
	}
	if err != nil {
		h.log.Error("create user: pg", "err", err)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}

	u, err := h.pg.GetUserByID(r.Context(), id.String())
	if err != nil {
		h.log.Error("create user: reload", "err", err)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}
	h.log.Info("user created", "user_id", u.ID, "role", u.Role)
	writeJSON(w, http.StatusCreated, userJSON(u))
}

func (h *handler) listUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.pg.ListUsers(r.Context())
	if err != nil {
		h.log.Error("list users", "err", err)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}
	out := make([]map[string]any, 0, len(users))
	for i := range users {
		out = append(out, userJSON(&users[i]))
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": out})
}

func (h *handler) getUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	u, err := h.pg.GetUserByID(r.Context(), id)
	if errors.Is(err, pgstore.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		h.log.Error("get user", "err", err, "id", id)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}
	cats, err := h.pg.GetUserCategories(r.Context(), id)
	if err != nil {
		h.log.Error("get user categories", "err", err, "id", id)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}
	out := userJSON(u)
	out["categories"] = cats
	writeJSON(w, http.StatusOK, out)
}

func (h *handler) setUserCategories(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	uid, err := uuid.Parse(id)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	var req struct {
		CategoryIDs []int `json:"category_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if _, err := h.pg.GetUserByID(r.Context(), id); errors.Is(err, pgstore.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	} else if err != nil {
		h.log.Error("set categories: user lookup", "err", err)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}

	if err := h.pg.SetUserCategories(r.Context(), uid, req.CategoryIDs); err != nil {
		// An unknown category id trips a foreign-key violation.
		h.log.Error("set categories", "err", err, "user_id", id)
		writeError(w, http.StatusBadRequest, "could not assign categories: "+err.Error())
		return
	}
	cats, err := h.pg.GetUserCategories(r.Context(), id)
	if err != nil {
		h.log.Error("set categories: reload", "err", err)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}
	h.log.Info("user categories updated", "user_id", id, "count", len(cats))
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "categories": cats})
}

func (h *handler) listCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.pg.ListCategories(r.Context())
	if err != nil {
		h.log.Error("list categories", "err", err)
		writeError(w, http.StatusBadGateway, "storage error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"categories": cats})
}

func userJSON(u *pgstore.User) map[string]any {
	return map[string]any{
		"id":         u.ID,
		"username":   u.Username,
		"role":       u.Role,
		"created_at": u.CreatedAt,
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
