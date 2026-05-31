FROM python:3.10-slim

WORKDIR /app

# Системные зависимости (для torch)
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ \
    && rm -rf /var/lib/apt/lists/*

# Установка Python-зависимостей
COPY requirements_benchmark.txt .
RUN pip install --no-cache-dir \
    -r requirements_benchmark.txt \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Копируем скрипты и данные
COPY train_setfit.py .
COPY data/dataset.csv data/
# Создаём папку для выходной модели
RUN mkdir -p model

# По умолчанию запускаем обучение, но можно переопределить в docker-compose
CMD ["python", "train_setfit.py"]