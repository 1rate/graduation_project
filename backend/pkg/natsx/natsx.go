// Package natsx provides thin helpers around the NATS JetStream client:
// connect, ensure-stream, ensure-consumer.
package natsx

import (
	"context"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

// Client bundles the bare NATS connection and a JetStream context.
type Client struct {
	NC *nats.Conn
	JS jetstream.JetStream
}

// Connect dials NATS and initialises the JetStream client.
func Connect(url string) (*Client, error) {
	nc, err := nats.Connect(url,
		nats.Timeout(5*time.Second),
		nats.MaxReconnects(-1),
		nats.ReconnectWait(2*time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("nats connect: %w", err)
	}
	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("jetstream new: %w", err)
	}
	return &Client{NC: nc, JS: js}, nil
}

// Close terminates the underlying NATS connection.
func (c *Client) Close() {
	c.NC.Close()
}

// EnsureStream is idempotent: creates the stream if missing, updates config if it exists.
func (c *Client) EnsureStream(ctx context.Context, name string, subjects []string) error {
	cfg := jetstream.StreamConfig{
		Name:      name,
		Subjects:  subjects,
		Storage:   jetstream.FileStorage,
		Retention: jetstream.LimitsPolicy,
		MaxAge:    7 * 24 * time.Hour,
	}
	if _, err := c.JS.CreateOrUpdateStream(ctx, cfg); err != nil {
		return fmt.Errorf("ensure stream %s: %w", name, err)
	}
	return nil
}

// EnsureConsumer creates or updates a durable pull-consumer with explicit ack.
func (c *Client) EnsureConsumer(ctx context.Context, stream, durableName, filterSubject string) (jetstream.Consumer, error) {
	s, err := c.JS.Stream(ctx, stream)
	if err != nil {
		return nil, fmt.Errorf("get stream %s: %w", stream, err)
	}
	cfg := jetstream.ConsumerConfig{
		Durable:       durableName,
		FilterSubject: filterSubject,
		AckPolicy:     jetstream.AckExplicitPolicy,
		MaxDeliver:    5,
		AckWait:       30 * time.Second,
	}
	cons, err := s.CreateOrUpdateConsumer(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("ensure consumer %s on %s: %w", durableName, stream, err)
	}
	return cons, nil
}
