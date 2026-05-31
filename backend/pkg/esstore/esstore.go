// Package esstore is a tiny Elasticsearch HTTP client (no external deps).
// Sufficient for ensure-index, upsert-doc, and search used by the diplom services.
package esstore

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Store struct {
	base   string
	index  string
	client *http.Client
}

func New(baseURL, index string) *Store {
	return &Store{
		base:   strings.TrimRight(baseURL, "/"),
		index:  index,
		client: &http.Client{Timeout: 15 * time.Second},
	}
}

const indexMapping = `{
  "mappings": {
    "properties": {
      "message_id":  {"type": "keyword"},
      "user_id":     {"type": "keyword"},
      "source":      {"type": "keyword"},
      "text":        {"type": "text", "analyzer": "russian"},
      "received_at": {"type": "date"},
      "sentiment": {
        "properties": {
          "label":         {"type": "keyword"},
          "score":         {"type": "float"},
          "model_version": {"type": "keyword"}
        }
      },
      "category": {
        "properties": {
          "category":      {"type": "keyword"},
          "score":         {"type": "float"},
          "model_version": {"type": "keyword"}
        }
      }
    }
  }
}`

// EnsureIndex creates the index with the documented mapping if it does not exist.
func (s *Store) EnsureIndex(ctx context.Context) error {
	req, _ := http.NewRequestWithContext(ctx, http.MethodHead, s.base+"/"+s.index, nil)
	res, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("es head: %w", err)
	}
	res.Body.Close()
	if res.StatusCode == http.StatusOK {
		return nil
	}

	createReq, _ := http.NewRequestWithContext(ctx, http.MethodPut, s.base+"/"+s.index, strings.NewReader(indexMapping))
	createReq.Header.Set("Content-Type", "application/json")
	createRes, err := s.client.Do(createReq)
	if err != nil {
		return fmt.Errorf("es create index: %w", err)
	}
	defer createRes.Body.Close()
	if createRes.StatusCode >= 300 {
		body, _ := io.ReadAll(createRes.Body)
		return fmt.Errorf("es create index status %d: %s", createRes.StatusCode, body)
	}
	return nil
}

// Upsert merges fields into an existing doc, or creates it if absent.
// Uses ES _update endpoint with doc_as_upsert=true.
func (s *Store) Upsert(ctx context.Context, id string, fields map[string]any) error {
	body := map[string]any{
		"doc":           fields,
		"doc_as_upsert": true,
	}
	buf := &bytes.Buffer{}
	if err := json.NewEncoder(buf).Encode(body); err != nil {
		return err
	}
	u := fmt.Sprintf("%s/%s/_update/%s", s.base, s.index, url.PathEscape(id))
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, u, buf)
	req.Header.Set("Content-Type", "application/json")
	res, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("es upsert: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("es upsert status %d: %s", res.StatusCode, b)
	}
	return nil
}

// SearchParams describes the query for full-text search with optional time-range
// filter, optional owner (user_id) filter, and pagination via from/size.
type SearchParams struct {
	Query  string
	UserID string // empty = all users
	From   *time.Time
	To     *time.Time
	Page   int // 1-based
	Size   int
}

// SearchHit is one decoded ES document.
type SearchHit map[string]any

// SearchResult holds total matches and the page slice.
type SearchResult struct {
	Total int64
	Hits  []SearchHit
}

// Search runs a match query on `text` (or match_all when Query is empty),
// optionally filtered by received_at range, and returns a single page of hits
// sorted by received_at desc.
func (s *Store) Search(ctx context.Context, p SearchParams) (*SearchResult, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.Size < 1 {
		p.Size = 20
	}
	from := (p.Page - 1) * p.Size

	var must []map[string]any
	if q := strings.TrimSpace(p.Query); q != "" {
		must = append(must, map[string]any{"match": map[string]any{"text": q}})
	} else {
		must = append(must, map[string]any{"match_all": map[string]any{}})
	}

	var filter []map[string]any
	if p.UserID != "" {
		filter = append(filter, map[string]any{"term": map[string]any{"user_id": p.UserID}})
	}
	if p.From != nil || p.To != nil {
		rng := map[string]any{}
		if p.From != nil {
			rng["gte"] = p.From.UTC().Format(time.RFC3339)
		}
		if p.To != nil {
			rng["lte"] = p.To.UTC().Format(time.RFC3339)
		}
		filter = append(filter, map[string]any{"range": map[string]any{"received_at": rng}})
	}

	body := map[string]any{
		"from": from,
		"size": p.Size,
		"sort": []any{map[string]any{"received_at": map[string]any{"order": "desc"}}},
		"query": map[string]any{
			"bool": map[string]any{"must": must, "filter": filter},
		},
	}

	var raw struct {
		Hits struct {
			Total struct {
				Value int64 `json:"value"`
			} `json:"total"`
			Hits []struct {
				Source SearchHit `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := s.postJSON(ctx, "/_search", body, &raw); err != nil {
		return nil, fmt.Errorf("es search: %w", err)
	}

	hits := make([]SearchHit, 0, len(raw.Hits.Hits))
	for _, h := range raw.Hits.Hits {
		hits = append(hits, h.Source)
	}
	return &SearchResult{Total: raw.Hits.Total.Value, Hits: hits}, nil
}

// AggBucket is a generic { key, count } pair returned by a terms aggregation.
type AggBucket struct {
	Key   string `json:"key"`
	Count int64  `json:"count"`
}

// AggTerms runs a terms aggregation on the given keyword field within an
// optional received_at range and optional owner (user_id) filter.
// Used by /stats/sentiment and /stats/categories.
func (s *Store) AggTerms(ctx context.Context, field, userID string, from, to *time.Time) ([]AggBucket, error) {
	body := map[string]any{
		"size":  0,
		"query": filteredQuery(userID, from, to),
		"aggs": map[string]any{
			"by_term": map[string]any{
				"terms": map[string]any{"field": field, "size": 50},
			},
		},
	}
	var raw struct {
		Aggregations struct {
			ByTerm struct {
				Buckets []struct {
					Key      any   `json:"key"`
					DocCount int64 `json:"doc_count"`
				} `json:"buckets"`
			} `json:"by_term"`
		} `json:"aggregations"`
	}
	if err := s.postJSON(ctx, "/_search", body, &raw); err != nil {
		return nil, fmt.Errorf("es agg terms: %w", err)
	}
	out := make([]AggBucket, 0, len(raw.Aggregations.ByTerm.Buckets))
	for _, b := range raw.Aggregations.ByTerm.Buckets {
		out = append(out, AggBucket{Key: fmt.Sprint(b.Key), Count: b.DocCount})
	}
	return out, nil
}

// TimelinePoint is one bucket of the timeline aggregation.
type TimelinePoint struct {
	Bucket time.Time            `json:"bucket"`
	Total  int64                `json:"total"`
	Counts map[string]int64     `json:"counts"`
}

// AggTimeline returns a date_histogram bucketed by `interval` ("hour"|"day"),
// each bucket sub-aggregated by the keyword field `subField` (e.g. "sentiment.label").
// Honours an optional owner (user_id) filter.
func (s *Store) AggTimeline(ctx context.Context, interval, subField, userID string, from, to *time.Time) ([]TimelinePoint, error) {
	body := map[string]any{
		"size":  0,
		"query": filteredQuery(userID, from, to),
		"aggs": map[string]any{
			"timeline": map[string]any{
				"date_histogram": map[string]any{
					"field":             "received_at",
					"calendar_interval": interval,
					"min_doc_count":     0,
				},
				"aggs": map[string]any{
					"by_term": map[string]any{
						"terms": map[string]any{"field": subField, "size": 20},
					},
				},
			},
		},
	}
	var raw struct {
		Aggregations struct {
			Timeline struct {
				Buckets []struct {
					KeyAsString string `json:"key_as_string"`
					DocCount    int64  `json:"doc_count"`
					ByTerm      struct {
						Buckets []struct {
							Key      any   `json:"key"`
							DocCount int64 `json:"doc_count"`
						} `json:"buckets"`
					} `json:"by_term"`
				} `json:"buckets"`
			} `json:"timeline"`
		} `json:"aggregations"`
	}
	if err := s.postJSON(ctx, "/_search", body, &raw); err != nil {
		return nil, fmt.Errorf("es agg timeline: %w", err)
	}
	out := make([]TimelinePoint, 0, len(raw.Aggregations.Timeline.Buckets))
	for _, b := range raw.Aggregations.Timeline.Buckets {
		t, _ := time.Parse(time.RFC3339, b.KeyAsString)
		counts := map[string]int64{}
		for _, sub := range b.ByTerm.Buckets {
			counts[fmt.Sprint(sub.Key)] = sub.DocCount
		}
		out = append(out, TimelinePoint{Bucket: t, Total: b.DocCount, Counts: counts})
	}
	return out, nil
}

// filteredQuery builds a bool/filter query from an optional owner (user_id) and
// an optional received_at range. With no filters it degrades to match_all.
func filteredQuery(userID string, from, to *time.Time) map[string]any {
	var filter []map[string]any
	if userID != "" {
		filter = append(filter, map[string]any{"term": map[string]any{"user_id": userID}})
	}
	if from != nil || to != nil {
		rng := map[string]any{}
		if from != nil {
			rng["gte"] = from.UTC().Format(time.RFC3339)
		}
		if to != nil {
			rng["lte"] = to.UTC().Format(time.RFC3339)
		}
		filter = append(filter, map[string]any{"range": map[string]any{"received_at": rng}})
	}
	if len(filter) == 0 {
		return map[string]any{"match_all": map[string]any{}}
	}
	return map[string]any{"bool": map[string]any{"filter": filter}}
}

func (s *Store) postJSON(ctx context.Context, path string, body, out any) error {
	buf := &bytes.Buffer{}
	if err := json.NewEncoder(buf).Encode(body); err != nil {
		return err
	}
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, s.base+"/"+s.index+path, buf)
	req.Header.Set("Content-Type", "application/json")
	res, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("status %d: %s", res.StatusCode, b)
	}
	return json.NewDecoder(res.Body).Decode(out)
}
