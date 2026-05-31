.PHONY: help up up-infra down down-volumes logs ps build images rebuild test lint \
        migrate-up migrate-down clean diagram smoke \
        run-auth run-ingest run-indexer run-analytics run-stt run-sentiment run-category

POSTGRES_DSN ?= postgres://diplom:diplom@localhost:5432/diplom?sslmode=disable

help:
	@echo "Главные команды:"
	@echo "  up             - поднять весь стек (инфра + сервисы) одним 'docker compose up -d'"
	@echo "  up-infra       - только инфраструктура (для локального dev Go-сервисов)"
	@echo "  down           - остановить весь стек (тома сохраняются)"
	@echo "  down-volumes   - остановить и УДАЛИТЬ ВСЕ тома (потеря данных)"
	@echo "  logs           - tail compose-логов"
	@echo "  ps             - список запущенных сервисов"
	@echo ""
	@echo "Сборка:"
	@echo "  images         - собрать docker-образы Go и Python сервисов"
	@echo "  rebuild        - собрать образы заново и поднять стек"
	@echo "  build          - go build всех модулей (без Docker)"
	@echo "  test           - go test всех модулей"
	@echo "  lint           - go vet + golangci-lint"
	@echo ""
	@echo "База:"
	@echo "  migrate-up     - применить миграции PostgreSQL"
	@echo "  migrate-down   - откатить одну миграцию"
	@echo ""
	@echo "Локальный запуск Go-сервисов (для горячей итерации, без Docker):"
	@echo "  run-ingest / run-indexer / run-analytics"
	@echo "  run-stt / run-sentiment / run-category   (Python — нужен venv)"
	@echo ""
	@echo "Прочее:"
	@echo "  diagram        - сгенерить docs/architecture/{pipeline,infrastructure}.png"
	@echo "  smoke          - запустить scripts/smoke.ps1 e2e-тест"

# ─── Стек ────────────────────────────────────────────────────────────────
up:
	docker compose up -d --build
	@echo ""
	@echo "Стек поднят. Wait ~30s для healthchecks. UI:"
	@echo "  API gateway    : http://localhost (nginx → все сервисы)"
	@echo "  Auth API       : http://localhost:8082/healthz"
	@echo "  Ingest API     : http://localhost:8080/healthz"
	@echo "  Analytics API  : http://localhost:8081 (Phase 2)"
	@echo "  NATS monitoring: http://localhost:8222"
	@echo "  MinIO console  : http://localhost:9001 (diplom / diplomdiplom)"
	@echo "  Kibana         : http://localhost:5601"
	@echo "  Prometheus     : http://localhost:9090"
	@echo "  Grafana        : http://localhost:3000 (admin / admin)"

up-infra:
	docker compose up -d nats postgres minio elasticsearch kibana prometheus grafana migrate

down:
	docker compose down

down-volumes:
	docker compose down -v

logs:
	docker compose logs -f --tail=100

ps:
	docker compose ps

images:
	docker compose build

rebuild:
	docker compose up -d --build --force-recreate

# ─── Go (без Docker) ────────────────────────────────────────────────────
build:
	cd pkg && go build ./...
	cd services/auth && go build ./...
	cd services/ingest && go build ./...
	cd services/indexer && go build ./...
	cd services/analytics && go build ./...

test:
	cd pkg && go test ./...
	cd services/auth && go test ./...
	cd services/ingest && go test ./...
	cd services/indexer && go test ./...
	cd services/analytics && go test ./...

lint:
	go vet ./...
	@command -v golangci-lint >/dev/null 2>&1 && golangci-lint run ./... || echo "golangci-lint not installed, skipping"

# ─── Миграции ────────────────────────────────────────────────────────────
migrate-up:
	migrate -path=migrations -database "$(POSTGRES_DSN)" up

migrate-down:
	migrate -path=migrations -database "$(POSTGRES_DSN)" down 1

# ─── Локальный запуск ───────────────────────────────────────────────────
run-auth:
	cd services/auth && go run .

run-ingest:
	cd services/ingest && go run .

run-indexer:
	cd services/indexer && go run .

run-analytics:
	cd services/analytics && go run .

run-stt:
	cd ml/stt && python main.py

run-sentiment:
	cd ml/sentiment && python main.py

run-category:
	cd ml/category && python main.py

# ─── Прочее ──────────────────────────────────────────────────────────────
diagram:
	python docs/architecture/diagram.py

smoke:
	powershell -ExecutionPolicy Bypass -File scripts/smoke.ps1

clean:
	rm -rf services/*/bin services/*/dist
