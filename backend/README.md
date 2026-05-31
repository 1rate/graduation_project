# Diplom — sentiment & category analysis pipeline

Дипломный проект: пайплайн анализа тональностей и категоризации пользовательских обращений.

## Стек

- **Go 1.23** — Ingest API, Indexer, Analytics API
- **Python 3.12** — STT (faster-whisper), Sentiment ML (ruBERT-tiny2), Category ML (ruBERT-tiny2)
- **NATS JetStream** — брокер сообщений
- **PostgreSQL** — метаданные и результаты ML
- **MinIO** — blob-хранилище для аудио
- **Elasticsearch + Kibana** — полнотекстовый поиск и агрегации
- **Prometheus + Grafana** — observability

Актуальный план — `PLAN.md`. Диаграммы — `docs/architecture/`.

## Быстрый старт — одной командой

```powershell
# Поднять весь стек (инфра + сервисы) одной командой
make up
# или: docker compose up -d --build

# Прогнать e2e-смоук: POST → ожидать обработки в ES
make smoke

# Остановить
make down
```

## Что куда смотрит

| Сервис | Адрес |
|---|---|
| Ingest API | `http://localhost:8080` (`POST /api/v1/messages`, `GET /healthz`) |
| Analytics API | `http://localhost:8081` (Phase 2) |
| NATS monitoring | `http://localhost:8222` |
| MinIO console | `http://localhost:9001` (`diplom` / `diplomdiplom`) |
| Kibana | `http://localhost:5601` |
| Prometheus | `http://localhost:9090` |
| Grafana | `http://localhost:3000` (`admin` / `admin`) |
| PostgreSQL | `localhost:5432` (user/pwd/db: `diplom`) |

## Структура репозитория

```
.
├── api/openapi.yaml           # контракт REST API для фронтенда (Phase 2)
├── deploy/                    # конфиги Prometheus, Grafana
├── docker-compose.yml         # вся инфра + 6 сервисов
├── Dockerfile.go              # шаблон для Go-сервисов (build-arg SERVICE)
├── Dockerfile.python          # шаблон для Python-сервисов
├── docs/architecture/         # pipeline.mmd, infrastructure.mmd, sequence.mmd, diagram.py
├── ml/
│   ├── stt/                   # Python: STT (faster-whisper)
│   ├── sentiment/             # Python: ruBERT-tiny2 sentiment
│   └── category/              # Python: ruBERT-tiny2 category
├── migrations/                # SQL-миграции (golang-migrate)
├── notebooks/                 # обучение моделей (Jupyter)
├── pkg/                       # общий Go-код
├── scripts/smoke.ps1          # e2e-смоук
└── services/
    ├── ingest/                # Go: HTTP API
    ├── indexer/               # Go: NATS → ES
    └── analytics/             # Go: REST API для фронта
```

## Локальная разработка (горячая итерация без Docker)

```powershell
# Поднять только инфру
make up-infra

# Запустить нужные сервисы локально (загружать .env вручную или через VS Code/GoLand)
make run-ingest
make run-indexer
make run-stt        # python ml/stt/main.py
make run-sentiment  # python ml/sentiment/main.py
make run-category   # python ml/category/main.py
```

## Требования

- **Docker Desktop** (с WSL2 backend на Windows)
- **Go 1.23+** — только для локальной разработки без Docker
- **Python 3.12+** — только для локальной разработки без Docker
- **make** — `choco install make` или Git Bash

Для рендера PNG-диаграмм:
- `pip install diagrams` + `choco install graphviz` (или работайте с `.mmd` через VS Code).

Для миграций без Docker:
- `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`
