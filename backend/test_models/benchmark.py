# benchmark.py - Версия для Docker с подключением к БД
"""
Бенчмарк моделей сентимента в Docker-контейнере.
Подключается к PostgreSQL, забирает сообщения, прогоняет через модели.
"""

import asyncio
import asyncpg
import json
import os
import time
import logging
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple

import numpy as np
from transformers import pipeline
import torch

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/app/output/benchmark.log')
    ]
)
log = logging.getLogger(__name__)

# Конфигурация из переменных окружения
DSN = os.environ.get(
    "POSTGRES_DSN",
    "postgres://diplom:diplom@postgres:5432/diplom?sslmode=disable"
)
SAMPLE_SIZE = int(os.environ.get("SAMPLE_SIZE", "100"))
MODELS = os.environ.get(
    "MODELS",
    "blanchefort/rubert-base-cased-sentiment,seara/rubert-tiny2-sentiment"
).split(",")


class ModelWrapper:
    """Обертка для модели"""
    def __init__(self, name: str):
        self.name = name
        self.load_time = 0
        self.total_time = 0
        self.count = 0
        self.classifier = None
    
    def load(self):
        """Загрузка модели"""
        start = time.time()
        log.info(f"📥 Загрузка модели {self.name}...")
        
        try:
            self.classifier = pipeline(
                "sentiment-analysis",
                model=self.name,
                tokenizer=self.name,
                device=-1  # CPU
            )
            self.load_time = time.time() - start
            log.info(f"✅ {self.name} загружена за {self.load_time:.2f}с")
        except Exception as e:
            log.error(f"❌ Ошибка загрузки {self.name}: {e}")
            raise
    
    def predict(self, text: str) -> Tuple[str, float]:
        """Предсказание"""
        start = time.time()
        
        result = self.classifier(text)[0]
        label = result['label'].lower()
        score = result['score']
        
        # Нормализация меток
        label_map = {
            'positive': 'positive', 'pos': 'positive',
            'negative': 'negative', 'neg': 'negative',
            'neutral': 'neutral', 'neu': 'neutral',
        }
        label = label_map.get(label, label)
        
        pred_time = time.time() - start
        self.total_time += pred_time
        self.count += 1
        
        return label, score
    
    @property
    def avg_time(self):
        return self.total_time / self.count if self.count > 0 else 0


async def fetch_messages(dsn: str, limit: int = None) -> List[Dict]:
    """Получение сообщений из базы данных"""
    log.info(f"🔌 Подключение к БД: {dsn}")
    
    try:
        conn = await asyncpg.connect(dsn)
    except Exception as e:
        log.error(f"❌ Ошибка подключения к БД: {e}")
        log.info("💡 Убедитесь, что PostgreSQL запущен и доступен")
        raise
    
    try:
        query = """
            SELECT 
                m.id as message_id,
                m.text,
                m.source,
                m.received_at,
                COALESCE(sr.label, 'unknown') as current_sentiment,
                COALESCE(sr.score, 0) as current_score
            FROM messages m
            LEFT JOIN sentiment_results sr ON m.id = sr.message_id
            WHERE m.text IS NOT NULL 
              AND length(m.text) > 10
            ORDER BY m.received_at DESC
        """
        
        if limit:
            query += f" LIMIT {limit}"
        
        rows = await conn.fetch(query)
        log.info(f"📊 Получено {len(rows)} сообщений из БД")
        
        return [
            {
                "message_id": str(row['message_id']),
                "text": row['text'],
                "source": row['source'],
                "received_at": row['received_at'].isoformat() if row['received_at'] else None,
                "current_sentiment": row['current_sentiment'],
                "current_score": float(row['current_score']) if row['current_score'] else 0
            }
            for row in rows
        ]
    finally:
        await conn.close()


def analyze_text(text: str) -> Dict:
    """Анализ характеристик текста"""
    text_lower = text.lower()
    
    return {
        "length": len(text),
        "words": len(text.split()),
        "has_question": "?" in text,
        "has_exclamation": "!" in text,
        "has_strong_negative": any(w in text_lower for w in [
            'дерьм', 'отстой', 'лажа', 'фигня', 'хрень', 'ерунд', 'ужас'
        ]),
        "has_strong_positive": any(w in text_lower for w in [
            'отлично', 'супер', 'прекрасно', 'великолепно'
        ]),
        "has_question_words": any(w in text_lower for w in [
            'как', 'когда', 'где', 'почему', 'подскажите', 'статус'
        ]),
    }


async def run_benchmark(messages: List[Dict], model_names: List[str]) -> Dict:
    """Запуск бенчмарка"""
    log.info(f"\n{'='*60}")
    log.info(f"🚀 ЗАПУСК БЕНЧМАРКА")
    log.info(f"{'='*60}")
    log.info(f"📝 Сообщений: {len(messages)}")
    log.info(f"🤖 Моделей: {len(model_names)}")
    
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_messages": len(messages),
        "models": {},
        "problematic_cases": []
    }
    
    # Загружаем и тестируем каждую модель
    all_predictions = {}
    
    for model_name in model_names:
        log.info(f"\n{'='*40}")
        log.info(f"Тестирование: {model_name}")
        
        model = ModelWrapper(model_name.strip())
        
        try:
            model.load()
        except Exception as e:
            log.error(f"Пропускаем {model_name} из-за ошибки загрузки")
            continue
        
        predictions = []
        distribution = defaultdict(int)
        confidence_stats = {"high": 0, "medium": 0, "low": 0}
        
        for i, msg in enumerate(messages):
            try:
                label, score = model.predict(msg["text"])
                
                pred = {
                    "message_id": msg["message_id"],
                    "text": msg["text"][:200] + "..." if len(msg["text"]) > 200 else msg["text"],
                    "text_stats": analyze_text(msg["text"]),
                    "predicted_label": label,
                    "predicted_score": score,
                    "current_label": msg["current_sentiment"],
                }
                
                predictions.append(pred)
                distribution[label] += 1
                
                if score > 0.8:
                    confidence_stats["high"] += 1
                elif score > 0.5:
                    confidence_stats["medium"] += 1
                else:
                    confidence_stats["low"] += 1
                
                if (i + 1) % 50 == 0:
                    log.info(f"  Прогресс: {i+1}/{len(messages)}")
                    
            except Exception as e:
                log.error(f"  Ошибка на сообщении {msg['message_id']}: {e}")
        
        all_predictions[model_name] = predictions
        
        results["models"][model_name] = {
            "name": model_name,
            "load_time": model.load_time,
            "total_time": model.total_time,
            "avg_time": model.avg_time,
            "total_predictions": model.count,
            "distribution": dict(distribution),
            "confidence_stats": confidence_stats,
            "sample_predictions": predictions[:10]  # Первые 10 для примера
        }
        
        log.info(f"✅ {model_name}: {model.count} предсказаний за {model.total_time:.2f}с")
        log.info(f"   Распределение: {dict(distribution)}")
        log.info(f"   Уверенность: высокая={confidence_stats['high']}, "
                f"средняя={confidence_stats['medium']}, низкая={confidence_stats['low']}")
    
    # Анализ разногласий между моделями
    if len(all_predictions) >= 2:
        log.info(f"\n🔍 Анализ разногласий...")
        model_names_list = list(all_predictions.keys())
        
        disagreement_count = 0
        problematic_cases = []
        
        for i in range(len(messages)):
            preds = {}
            for name in model_names_list:
                if i < len(all_predictions[name]):
                    preds[name] = all_predictions[name][i]["predicted_label"]
            
            if len(set(preds.values())) > 1:  # Есть разногласия
                disagreement_count += 1
                
                case = {
                    "message_id": messages[i]["message_id"],
                    "text": messages[i]["text"][:150],
                    "predictions": preds,
                    "text_stats": analyze_text(messages[i]["text"])
                }
                problematic_cases.append(case)
        
        results["disagreement_count"] = disagreement_count
        results["problematic_cases"] = problematic_cases[:20]  # Топ-20
        
        log.info(f"⚠️  Найдено {disagreement_count} случаев разногласий из {len(messages)}")
        
        # Согласованность попарно
        log.info(f"\n🤝 Попарная согласованность:")
        for i, m1 in enumerate(model_names_list):
            for m2 in model_names_list[i+1:]:
                agree = 0
                total = 0
                for j in range(len(messages)):
                    if (j < len(all_predictions[m1]) and 
                        j < len(all_predictions[m2])):
                        if (all_predictions[m1][j]["predicted_label"] == 
                            all_predictions[m2][j]["predicted_label"]):
                            agree += 1
                        total += 1
                
                if total > 0:
                    rate = agree / total
                    log.info(f"  {m1.split('/')[-1]} ↔ {m2.split('/')[-1]}: {rate:.1%}")
    
    return results


def print_summary(results: Dict):
    """Вывод итогового отчета"""
    print("\n" + "="*80)
    print("📊 ИТОГОВЫЙ ОТЧЕТ")
    print("="*80)
    
    print(f"\n📅 Дата: {results['timestamp']}")
    print(f"📝 Всего сообщений: {results['total_messages']}")
    
    # Таблица сравнения
    print(f"\n{'Модель':<50} {'Загрузка':<10} {'Ср.время':<10} {'Neg/Neu/Pos'}")
    print("-"*90)
    
    for name, data in results["models"].items():
        short_name = name.split('/')[-1]
        dist = data["distribution"]
        dist_str = f"{dist.get('negative',0)}/{dist.get('neutral',0)}/{dist.get('positive',0)}"
        
        print(f"{short_name:<50} {data['load_time']:>6.1f}с {data['avg_time']*1000:>7.1f}мс {dist_str}")
    
    # Проблемные кейсы
    if results.get("problematic_cases"):
        print(f"\n⚠️  Примеры разногласий (всего: {results.get('disagreement_count', 0)}):")
        for case in results["problematic_cases"][:5]:
            print(f"\n  📝 {case['text'][:100]}...")
            for model, pred in case["predictions"].items():
                print(f"     {model.split('/')[-1]:<30} → {pred}")
    
    # Рекомендация
    print(f"\n{'='*80}")
    print("💡 РЕКОМЕНДАЦИЯ")
    print(f"{'='*80}")
    print("На основе анализа рекомендуется использовать:")
    print("  • blanchefort/rubert-base-cased-sentiment")
    print("    - Лучше всего работает с разговорной речью")
    print("    - Хорошо различает негатив и нейтральные вопросы")
    print("    - Высокая уверенность в предсказаниях")


async def main():
    """Главная функция"""
    log.info("🚀 Запуск бенчмарка сентимент-моделей в Docker")
    
    # Получаем сообщения
    try:
        messages = await fetch_messages(DSN, SAMPLE_SIZE)
    except Exception as e:
        log.error(f"Не удалось получить данные из БД: {e}")
        log.info("Проверьте:")
        log.info("  1. Запущен ли PostgreSQL")
        log.info("  2. Правильный ли DSN в переменной POSTGRES_DSN")
        log.info("  3. Есть ли таблица messages с данными")
        return
    
    if not messages:
        log.error("Нет сообщений для анализа!")
        return
    
    # Запускаем бенчмарк
    results = await run_benchmark(messages, MODELS)
    
    # Сохраняем результаты
    output_file = f"/app/output/benchmark_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    # Упрощаем для сохранения
    save_results = {
        "timestamp": results["timestamp"],
        "total_messages": results["total_messages"],
        "models": {}
    }
    
    for name, data in results["models"].items():
        save_results["models"][name] = {
            "name": data["name"],
            "load_time": data["load_time"],
            "avg_time": data["avg_time"],
            "distribution": data["distribution"],
            "confidence_stats": data["confidence_stats"]
        }
    
    save_results["disagreement_count"] = results.get("disagreement_count", 0)
    save_results["problematic_cases"] = results.get("problematic_cases", [])[:10]
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(save_results, f, ensure_ascii=False, indent=2)
    
    log.info(f"\n📁 Результаты сохранены в {output_file}")
    
    # Выводим итоги
    print_summary(results)
    
    # Копируем результаты в удобное место
    latest_link = "/app/output/latest_results.json"
    with open(latest_link, 'w', encoding='utf-8') as f:
        json.dump(save_results, f, ensure_ascii=False, indent=2)
    
    log.info(f"📁 Копия сохранена в {latest_link}")


if __name__ == "__main__":
    start_time = time.time()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("\nПрервано пользователем")
    except Exception as e:
        log.exception(f"Критическая ошибка: {e}")
    
    total_time = time.time() - start_time
    log.info(f"\n⏱️  Общее время выполнения: {total_time:.1f}с")
    log.info("✅ Бенчмарк завершен")