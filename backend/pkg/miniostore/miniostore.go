// Package miniostore wraps minio-go for object storage operations.
package miniostore

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Store struct {
	client *minio.Client
	bucket string
}

func Connect(endpoint, accessKey, secretKey, bucket string, useSSL bool) (*Store, error) {
	c, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		// Region must be set explicitly so PresignedGetObject does not call
		// GetBucketLocation against the endpoint — that lookup fails for the
		// browser-facing host (e.g. localhost:9000) used purely for presigning.
		Region: "us-east-1",
	})
	if err != nil {
		return nil, fmt.Errorf("minio new: %w", err)
	}
	return &Store{client: c, bucket: bucket}, nil
}

// EnsureBucket creates the bucket if missing. Idempotent.
func (s *Store) EnsureBucket(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return fmt.Errorf("minio bucket exists: %w", err)
	}
	if exists {
		return nil
	}
	if err := s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{}); err != nil {
		return fmt.Errorf("minio make bucket: %w", err)
	}
	return nil
}

func (s *Store) Bucket() string { return s.bucket }

// Put uploads an object. size may be -1 if unknown (streamed).
func (s *Store) Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucket, key, r, size, minio.PutObjectOptions{ContentType: contentType})
	return err
}

func (s *Store) Get(ctx context.Context, key string) (io.ReadCloser, error) {
	return s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
}

// PresignGet returns a temporary HTTP URL the caller can fetch directly from MinIO.
// The URL host is whatever endpoint was passed to Connect — use a publicly reachable
// hostname (e.g. localhost:9000) for browser-facing flows, not the docker-internal one.
func (s *Store) PresignGet(ctx context.Context, key string, ttl time.Duration) (string, error) {
	u, err := s.client.PresignedGetObject(ctx, s.bucket, key, ttl, url.Values{})
	if err != nil {
		return "", fmt.Errorf("minio presign: %w", err)
	}
	return u.String(), nil
}
