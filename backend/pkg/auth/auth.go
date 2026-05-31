// Package auth is the single source of truth for authentication across the
// diplom Go services: HS256 JWT issue/verify, bcrypt password hashing, and
// HTTP middleware. The JWT is self-contained (stateless) — services only need
// the shared JWT_SECRET to validate it.
package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// Roles. Stored verbatim in the users.role column and the JWT.
const (
	RoleAdmin = "admin"
	RoleUser  = "user"
)

// Claims is the JWT payload. Field tags follow JWT conventions (sub/iat/exp).
type Claims struct {
	UserID   string `json:"sub"`
	Username string `json:"username"`
	Role     string `json:"role"`
	IssuedAt int64  `json:"iat"`
	Expires  int64  `json:"exp"`
}

var (
	ErrBadToken     = errors.New("invalid token")
	ErrTokenExpired = errors.New("token expired")
)

// HashPassword returns a bcrypt hash suitable for storage in users.password_hash.
func HashPassword(plain string) (string, error) {
	h, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(h), err
}

// CheckPassword reports whether plain matches the stored bcrypt hash.
func CheckPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

func b64(b []byte) string { return base64.RawURLEncoding.EncodeToString(b) }

func sign(secret, signingInput string) string {
	m := hmac.New(sha256.New, []byte(secret))
	m.Write([]byte(signingInput))
	return b64(m.Sum(nil))
}

// IssueToken creates a signed HS256 JWT valid for ttl.
func IssueToken(secret, userID, username, role string, ttl time.Duration) (string, error) {
	now := time.Now()
	header := b64([]byte(`{"alg":"HS256","typ":"JWT"}`))
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		IssuedAt: now.Unix(),
		Expires:  now.Add(ttl).Unix(),
	}
	cj, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	signingInput := header + "." + b64(cj)
	return signingInput + "." + sign(secret, signingInput), nil
}

// ParseToken verifies the HS256 signature and expiry, returning the claims.
func ParseToken(secret, token string) (*Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, ErrBadToken
	}
	signingInput := parts[0] + "." + parts[1]
	if !hmac.Equal([]byte(sign(secret, signingInput)), []byte(parts[2])) {
		return nil, ErrBadToken
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, ErrBadToken
	}
	var c Claims
	if err := json.Unmarshal(payload, &c); err != nil {
		return nil, ErrBadToken
	}
	if time.Now().Unix() >= c.Expires {
		return nil, ErrTokenExpired
	}
	return &c, nil
}

type ctxKey struct{}

// FromContext returns the claims placed on the request context by Middleware.
func FromContext(ctx context.Context) (*Claims, bool) {
	c, ok := ctx.Value(ctxKey{}).(*Claims)
	return c, ok
}

// Middleware verifies the Authorization: Bearer <jwt> header. When adminOnly is
// true it additionally requires role=admin. On success the claims are attached
// to the request context (see FromContext).
func Middleware(secret string, adminOnly bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tok := bearer(r)
			if tok == "" {
				writeErr(w, http.StatusUnauthorized, "missing bearer token")
				return
			}
			c, err := ParseToken(secret, tok)
			if err != nil {
				writeErr(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}
			if adminOnly && c.Role != RoleAdmin {
				writeErr(w, http.StatusForbidden, "admin role required")
				return
			}
			ctx := context.WithValue(r.Context(), ctxKey{}, c)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func bearer(r *http.Request) string {
	const prefix = "Bearer "
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(h, prefix) {
		return strings.TrimSpace(h[len(prefix):])
	}
	return ""
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
