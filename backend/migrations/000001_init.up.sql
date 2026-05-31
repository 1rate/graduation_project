CREATE TABLE messages (
    id            UUID PRIMARY KEY,
    source        TEXT        NOT NULL CHECK (source IN ('text', 'audio')),
    audio_object  TEXT,
    text          TEXT,
    status        TEXT        NOT NULL CHECK (status IN ('pending', 'transcribed', 'enriched', 'failed')),
    received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_received_at ON messages (received_at DESC);
CREATE INDEX idx_messages_status      ON messages (status);

CREATE TABLE sentiment_results (
    message_id    UUID        PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
    label         TEXT        NOT NULL,
    score         REAL        NOT NULL,
    model_version TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sentiment_results_label ON sentiment_results (label);

CREATE TABLE category_results (
    message_id    UUID        PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
    category      TEXT        NOT NULL,
    score         REAL        NOT NULL,
    model_version TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_category_results_category ON category_results (category);

-- Idempotency tracking. Each (stage, message_id) is processed exactly once.

