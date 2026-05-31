# sentiment_service.py — версия с SentenceTransformer + sklearn (без правил)
"""
Sentiment service с дообученной моделью (sentence-transformers + классификатор).
Ожидает модель в папке, указанной в MODEL_PATH (по умолчанию ./model).
"""

import asyncio
import json
import logging
import os
import signal
import pickle

import asyncpg
import nats
from nats.errors import TimeoutError as NatsTimeout
from nats.js.api import StreamConfig
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Конфигурация
# ---------------------------------------------------------------------------
NATS_URL = os.environ.get("NATS_URL", "nats://nats:4222")
DSN = os.environ.get(
    "POSTGRES_DSN",
    "postgres://diplom:diplom@postgres:5432/diplom?sslmode=disable",
)

MODEL_PATH = os.environ.get("MODEL_PATH", "./model")   # папка с transformer/ и classifier.pkl

SERVICE = "sentiment"
DURABLE = "sentiment"
MODEL_VERSION = "setfit-v1"   # можно менять при переобучении

STREAM_TEXT = "MESSAGES_TEXT"
STREAM_ENRICHED = "MESSAGES_ENRICHED"
SUBJECT_TEXT = "messages.text"
SUBJECT_ENRICHED = "messages.enriched"

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format=f"[{SERVICE}] %(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(SERVICE)


# ---------------------------------------------------------------------------
# Модель
# ---------------------------------------------------------------------------
class SentimentModel:
    """Обученная модель (SentenceTransformer + LogisticRegression). Без правил."""

    def __init__(self, model_path: str):
        log.info(f"Loading model from {model_path}")

        # Загружаем трансформер для эмбеддингов
        self.embedder = SentenceTransformer(os.path.join(model_path, "transformer"))

        # Загружаем классификатор и маппинг меток
        with open(os.path.join(model_path, "classifier.pkl"), "rb") as f:
            self.clf, self.label2id, self.id2label = pickle.load(f)

        log.info("Model loaded")

    def predict(self, text: str) -> tuple[str, float]:
        """
        Возвращает (label, score).
        label: 'negative', 'neutral', 'positive'
        """
        # Получаем эмбеддинг текста
        emb = self.embedder.encode([text])

        # Предсказание
        pred_id = self.clf.predict(emb)[0]
        probas = self.clf.predict_proba(emb)[0]

        label = self.id2label[pred_id]
        score = float(probas[pred_id])

        return label, score


# ---------------------------------------------------------------------------
# Работа с NATS и PostgreSQL
# ---------------------------------------------------------------------------
async def ensure_stream(js, name: str, subjects: list[str]) -> None:
    try:
        await js.add_stream(StreamConfig(name=name, subjects=subjects))
    except Exception as e:
        log.debug(f"add_stream({name}) -> {e}")


async def handle(msg, pool, js, model: SentimentModel) -> None:
    tm = json.loads(msg.data)
    message_id = tm["message_id"]
    text = tm["text"]

    # Предсказание в отдельном потоке, чтобы не блокировать event loop
    label, score = await asyncio.to_thread(model.predict, text)

    log.info(f"{message_id} | {label} ({score:.3f}) | {text[:80]}...")

    # Сохранение в БД
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO sentiment_results (message_id, label, score, model_version)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (message_id) DO UPDATE SET
                label = EXCLUDED.label,
                score = EXCLUDED.score,
                model_version = EXCLUDED.model_version,
                created_at = NOW()
            """,
            message_id, label, score, MODEL_VERSION,
        )

    # Публикация обогащённого сообщения
    enriched = {
        "kind": "sentiment",
        "sentiment": {
            "message_id": message_id,
            "label": label,
            "score": score,
            "model_version": MODEL_VERSION,
        },
    }
    await js.publish(SUBJECT_ENRICHED, json.dumps(enriched).encode())
    await msg.ack()


async def main() -> None:
    log.info(f"Starting sentiment service with model {MODEL_PATH}")

    # Инициализация модели
    model = SentimentModel(MODEL_PATH)

    # Подключение к NATS
    nc = await nats.connect(NATS_URL, max_reconnect_attempts=-1)
    js = nc.jetstream()

    # Создание стримов при необходимости
    await ensure_stream(js, STREAM_TEXT, [SUBJECT_TEXT])
    await ensure_stream(js, STREAM_ENRICHED, [SUBJECT_ENRICHED])

    # Пул соединений с БД
    pool = await asyncpg.create_pool(DSN, min_size=1, max_size=4)

    # Подписка
    sub = await js.pull_subscribe(SUBJECT_TEXT, durable=DURABLE, stream=STREAM_TEXT)
    log.info(f"Consuming {SUBJECT_TEXT}")

    # Graceful shutdown
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
                log.exception(f"Handler error: {e}")
                await msg.nak()

    log.info("Shutting down")
    await nc.close()
    await pool.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass