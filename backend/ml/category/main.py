"""
Category service — real inference (Phase 5).

Consumes messages.text. For each appeal:
  1. loads `name`s of categories the admin assigned to the message's user,
  2. runs the ONNX rubert-tiny2 model over the full 30-class catalog,
  3. keeps only logits that correspond to assigned-category labels,
  4. applies softmax on the restricted set and picks argmax,
  5. if the best score (after restriction) < CATEGORY_MIN_SCORE OR the user
     has no assigned categories, returns "без категории".

Model artifacts live in MODEL_DIR (default /app/model):
    model.onnx
    tokenizer/...
    labels.json   {"label_codes":[...], "label_names":[...], "max_len": N}

label_codes[i] / label_names[i] correspond to logit index i.
"""

import asyncio
import json
import logging
import os
import signal
from pathlib import Path

import asyncpg
import nats
import numpy as np
import onnxruntime as ort
from nats.errors import TimeoutError as NatsTimeout
from nats.js.api import StreamConfig
from transformers import AutoTokenizer

NATS_URL = os.environ.get("NATS_URL", "nats://nats:4222")
DSN = os.environ.get(
    "POSTGRES_DSN",
    "postgres://diplom:diplom@postgres:5432/diplom?sslmode=disable",
)
MODEL_DIR = Path(os.environ.get("MODEL_DIR", "/app/model"))
MIN_SCORE = float(os.environ.get("CATEGORY_MIN_SCORE", "0.5"))

SERVICE = "category"
DURABLE = "category"
MODEL_VERSION = "rubert-tiny2-onnx-1"
CATEGORY_NONE = "без категории"  # mirrors pkg/messages.CategoryNone in Go

STREAM_TEXT = "MESSAGES_TEXT"
STREAM_ENRICHED = "MESSAGES_ENRICHED"
SUBJECT_TEXT = "messages.text"
SUBJECT_ENRICHED = "messages.enriched"

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format=f"[{SERVICE}] %(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(SERVICE)


class CategoryModel:
    """ONNX rubert-tiny2 над всеми 30 классами, с пост-фильтрацией по allowed."""

    def __init__(self, model_dir: Path):
        meta = json.loads((model_dir / "labels.json").read_text(encoding="utf-8"))
        self.label_codes: list[str] = meta["label_codes"]
        self.label_names: list[str] = meta["label_names"]
        self.max_len: int = int(meta.get("max_len", 96))
        # быстрый lookup: имя категории → индекс логита
        self.name_to_idx: dict[str, int] = {n: i for i, n in enumerate(self.label_names)}
        self.tokenizer = AutoTokenizer.from_pretrained(str(model_dir / "tokenizer"))
        self.session = ort.InferenceSession(
            str(model_dir / "model.onnx"),
            providers=["CPUExecutionProvider"],
        )
        log.info(
            f"model loaded: labels={len(self.label_names)} max_len={self.max_len} "
            f"providers={self.session.get_providers()}"
        )

    def _logits(self, text: str) -> np.ndarray:
        enc = self.tokenizer(text, truncation=True, max_length=self.max_len, return_tensors="np")
        return self.session.run(
            ["logits"],
            {
                "input_ids": enc["input_ids"].astype(np.int64),
                "attention_mask": enc["attention_mask"].astype(np.int64),
            },
        )[0][0]

    def predict(self, text: str, allowed_names: list[str]) -> tuple[str, float]:
        """Возвращает (category_name, score). Если allowed пуст или score<MIN — 'без категории'."""
        if not allowed_names:
            return CATEGORY_NONE, 1.0

        logits = self._logits(text)
        # маппим имена в индексы логитов; неизвестные имена (= не из каталога) игнорируем
        allowed_idx = [self.name_to_idx[n] for n in allowed_names if n in self.name_to_idx]
        if not allowed_idx:
            return CATEGORY_NONE, 1.0

        restricted = logits[allowed_idx]
        # softmax по урезанному подмножеству — score интерпретируется как уверенность
        # модели среди разрешённых классов (а не среди всех 30).
        e = np.exp(restricted - restricted.max())
        probs = e / e.sum()
        best_local = int(probs.argmax())
        score = float(probs[best_local])
        if score < MIN_SCORE:
            return CATEGORY_NONE, score
        return self.label_names[allowed_idx[best_local]], score


async def assigned_categories(conn, user_id: str) -> list[str]:
    if not user_id:
        return []
    rows = await conn.fetch(
        """
        SELECT c.name
        FROM categories c
        JOIN user_categories uc ON uc.category_id = c.id
        WHERE uc.user_id = $1
        ORDER BY c.id
        """,
        user_id,
    )
    return [r["name"] for r in rows]


async def ensure_stream(js, name: str, subjects: list[str]) -> None:
    try:
        await js.add_stream(StreamConfig(name=name, subjects=subjects))
    except Exception as e:
        log.debug(f"add_stream({name}) -> {e}")


async def handle(msg, pool, js, model: CategoryModel) -> None:
    tm = json.loads(msg.data)
    message_id = tm["message_id"]
    user_id = tm.get("user_id", "")

    async with pool.acquire() as conn:
        allowed = await assigned_categories(conn, user_id)
        category, score = await asyncio.to_thread(model.predict, tm["text"], allowed)
        await conn.execute(
            """
            INSERT INTO category_results (message_id, category, score, model_version)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (message_id) DO UPDATE SET
                category = EXCLUDED.category,
                score = EXCLUDED.score,
                model_version = EXCLUDED.model_version,
                created_at = NOW()
            """,
            message_id, category, score, MODEL_VERSION,
        )

    enriched = {
        "kind": "category",
        "category": {
            "message_id": message_id,
            "category": category,
            "score": score,
            "model_version": MODEL_VERSION,
        },
    }
    await js.publish(SUBJECT_ENRICHED, json.dumps(enriched).encode())
    await msg.ack()
    log.info(
        f"category message_id={message_id} user_id={user_id} "
        f"category={category} score={score:.3f} allowed={len(allowed)}"
    )


async def main() -> None:
    log.info(f"starting; MODEL_DIR={MODEL_DIR} MIN_SCORE={MIN_SCORE}")
    model = CategoryModel(MODEL_DIR)

    nc = await nats.connect(NATS_URL, max_reconnect_attempts=-1)
    js = nc.jetstream()

    await ensure_stream(js, STREAM_TEXT, [SUBJECT_TEXT])
    await ensure_stream(js, STREAM_ENRICHED, [SUBJECT_ENRICHED])

    pool = await asyncpg.create_pool(DSN, min_size=1, max_size=4)

    sub = await js.pull_subscribe(SUBJECT_TEXT, durable=DURABLE, stream=STREAM_TEXT)
    log.info(f"consuming {SUBJECT_TEXT}")

    stop = asyncio.Event()
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)

    while not stop.is_set():
        try:
            msgs = await sub.fetch(batch=1, timeout=2)
        except (asyncio.TimeoutError, NatsTimeout):
            continue

        for msg in msgs:
            try:
                await handle(msg, pool, js, model)
            except Exception as e:
                log.exception(f"handler error: {e}")
                await msg.nak()

    log.info("shutting down")
    await nc.close()
    await pool.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
