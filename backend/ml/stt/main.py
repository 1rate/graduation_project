"""
STT service — real inference (Phase 4).

Consumes messages.raw from NATS:
- source=text  -> pass-through (publishes the text as-is to messages.text)
- source=audio -> downloads the blob from MinIO by audio_object key,
                  runs faster-whisper transcription, publishes the text.

Whisper params come from env:
    WHISPER_MODEL    small | medium | large-v3 | base | tiny
    WHISPER_DEVICE   cpu | cuda | auto
    WHISPER_COMPUTE  int8 | int8_float16 | float16 | float32
    WHISPER_LANGUAGE ru (default)

Model is auto-downloaded to ~/.cache/huggingface on first use; in compose
that path is a named volume so restarts don't re-download.
"""

import asyncio
import io
import json
import logging
import os
import signal
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

import asyncpg
import nats
from faster_whisper import WhisperModel
from minio import Minio
from nats.errors import TimeoutError as NatsTimeout
from nats.js.api import StreamConfig

NATS_URL = os.environ.get("NATS_URL", "nats://nats:4222")
DSN = os.environ.get(
    "POSTGRES_DSN",
    "postgres://diplom:diplom@postgres:5432/diplom?sslmode=disable",
)

MINIO_ENDPOINT = os.environ.get("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.environ.get("MINIO_ACCESS_KEY", "diplom")
MINIO_SECRET_KEY = os.environ.get("MINIO_SECRET_KEY", "diplomdiplom")
MINIO_BUCKET = os.environ.get("MINIO_BUCKET", "diplom-audio")
MINIO_USE_SSL = os.environ.get("MINIO_USE_SSL", "false").lower() == "true"

WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "small")
WHISPER_DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE = os.environ.get("WHISPER_COMPUTE", "int8")
WHISPER_LANGUAGE = os.environ.get("WHISPER_LANGUAGE", "ru")

SERVICE = "stt"
DURABLE = "stt"

STREAM_RAW = "MESSAGES_RAW"
STREAM_TEXT = "MESSAGES_TEXT"
SUBJECT_RAW = "messages.raw"
SUBJECT_TEXT = "messages.text"

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format=f"[{SERVICE}] %(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(SERVICE)


class WhisperTranscriber:
    """Тонкая обёртка над faster-whisper. Загружает модель один раз при старте."""

    def __init__(self, model_size: str, device: str, compute_type: str, language: str):
        log.info(
            f"loading whisper: model={model_size} device={device} compute={compute_type} language={language}"
        )
        t0 = time.perf_counter()
        self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
        self.language = language
        log.info(f"whisper ready in {time.perf_counter() - t0:.1f}s")

    def transcribe_bytes(self, audio_bytes: bytes) -> str:
        # faster-whisper читает файл с диска (через ffmpeg). Пишем во временный файл.
        with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            segments, _info = self.model.transcribe(
                tmp_path,
                language=self.language,
                vad_filter=True,           # отрезает тишину, душит галлюцинации
                beam_size=1,               # быстрее, на коротких записях по качеству не теряем
                condition_on_previous_text=False,
            )
            text = " ".join(seg.text.strip() for seg in segments).strip()
            return text
        finally:
            try:
                Path(tmp_path).unlink()
            except OSError:
                pass


class AudioStore:
    """Скачиватель аудио-блобов из MinIO."""

    def __init__(self, endpoint: str, access_key: str, secret_key: str, bucket: str, secure: bool):
        self.client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)
        self.bucket = bucket

    def fetch(self, object_key: str) -> bytes:
        resp = self.client.get_object(self.bucket, object_key)
        try:
            return resp.read()
        finally:
            resp.close()
            resp.release_conn()


async def transcribe(raw: dict, whisper: WhisperTranscriber, audio: AudioStore) -> str:
    if raw["source"] == "text":
        return raw.get("text", "")
    if raw["source"] == "audio":
        key = raw.get("audio_object")
        if not key:
            raise ValueError("audio source without audio_object")
        log.info(f"fetching audio bucket={audio.bucket} key={key}")
        audio_bytes = await asyncio.to_thread(audio.fetch, key)
        t0 = time.perf_counter()
        text = await asyncio.to_thread(whisper.transcribe_bytes, audio_bytes)
        log.info(
            f"transcribed bytes={len(audio_bytes)} chars={len(text)} dt={time.perf_counter() - t0:.2f}s"
        )
        return text
    raise ValueError(f"unknown source: {raw['source']}")


async def ensure_stream(js, name: str, subjects: list[str]) -> None:
    try:
        await js.add_stream(StreamConfig(name=name, subjects=subjects))
    except Exception as e:
        log.debug(f"add_stream({name}) -> {e}")


async def handle(msg, pool, js, whisper: WhisperTranscriber, audio: AudioStore) -> None:
    raw = json.loads(msg.data)
    message_id = raw["message_id"]

    text = await transcribe(raw, whisper, audio)

    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE messages SET text = $1, status = 'transcribed', updated_at = NOW() WHERE id = $2",
            text,
            message_id,
        )

    out = {
        "message_id": message_id,
        "user_id": raw.get("user_id", ""),
        "text": text,
        "original_source": raw["source"],
        "received_at": raw.get("received_at") or datetime.now(timezone.utc).isoformat(),
    }
    await js.publish(SUBJECT_TEXT, json.dumps(out).encode())
    await msg.ack()
    log.info(f"published message_id={message_id} source={raw['source']} chars={len(text)}")


async def main() -> None:
    log.info("starting")

    whisper = WhisperTranscriber(
        model_size=WHISPER_MODEL,
        device=WHISPER_DEVICE,
        compute_type=WHISPER_COMPUTE,
        language=WHISPER_LANGUAGE,
    )
    audio = AudioStore(
        endpoint=MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        bucket=MINIO_BUCKET,
        secure=MINIO_USE_SSL,
    )

    nc = await nats.connect(NATS_URL, max_reconnect_attempts=-1)
    js = nc.jetstream()

    await ensure_stream(js, STREAM_RAW, [SUBJECT_RAW])
    await ensure_stream(js, STREAM_TEXT, [SUBJECT_TEXT])

    pool = await asyncpg.create_pool(DSN, min_size=1, max_size=4)

    sub = await js.pull_subscribe(SUBJECT_RAW, durable=DURABLE, stream=STREAM_RAW)
    log.info(f"consuming {SUBJECT_RAW}")

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
                await handle(msg, pool, js, whisper, audio)
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
