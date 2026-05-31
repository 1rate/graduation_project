// Package config provides minimal env-var helpers.
package config

import "os"

// Get returns the env var or fallback if unset/empty.
func Get(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// MustGet panics if the env var is unset/empty.
func MustGet(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("required env var not set: " + key)
	}
	return v
}
