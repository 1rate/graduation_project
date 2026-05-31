// Package logging provides a small wrapper around log/slog with env-driven level.
package logging

import (
	"log/slog"
	"os"
	"strings"
)

// New returns a JSON logger tagged with the service name.
// Level is read from the LOG_LEVEL env var (debug | info | warn | error). Default: info.
func New(service string) *slog.Logger {
	level := slog.LevelInfo
	switch strings.ToLower(os.Getenv("LOG_LEVEL")) {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	}
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	return slog.New(h).With("service", service)
}
