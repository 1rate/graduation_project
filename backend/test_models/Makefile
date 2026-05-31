# Makefile
.PHONY: test quick-test db-test compare interactive build clean

# Сборка образа
build:
	docker-compose build

# Полный тест на готовых примерах
test:
	docker-compose --profile test run --rm sentiment-test

# Быстрый тест основных проблем
quick-test:
	docker-compose --profile quick run --rm sentiment-test-quick

# Тест на данных из БД
db-test:
	docker-compose --profile db run --rm sentiment-benchmark-db

train:
	docker-compose --profile train run --rm sentiment-train

# Сравнение моделей на готовых примерах
compare:
	docker-compose --profile compare run --rm sentiment-benchmark-quick

# Интерактивный режим (можно запускать свои скрипты)
interactive:
	docker-compose --profile interactive run --rm sentiment-interactive

# Просмотр результатов
view-results:
	@echo "=== Результаты тестов ==="
	@ls -lh output/
	@echo ""
	@echo "=== Последний результат ==="
	@cat output/latest_results.json 2>/dev/null | python -m json.tool || echo "Нет результатов"

# Очистка
clean:
	docker-compose down
	rm -rf output/*
	docker volume rm sentiment_benchmark_hf_cache 2>/dev/null || true

# Полный цикл: сборка + тест
all: build test quick-test
	@echo ""
	@echo "✅ Все тесты пройдены!"
	@echo "📁 Результаты в ./output/"