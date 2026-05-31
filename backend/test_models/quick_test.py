# quick_test.py - Быстрый тест без подключения к БД
"""
Быстрый тест моделей на готовых примерах.
Не требует подключения к базе данных.
"""

import json
import os
import time
import logging
from datetime import datetime
from collections import defaultdict

from transformers import pipeline

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/app/output/quick_test.log')
    ]
)
log = logging.getLogger(__name__)

# Модели для тестирования
MODELS = os.environ.get(
    "MODELS",
    "blanchefort/rubert-base-cased-sentiment,seara/rubert-tiny2-sentiment,cointegrated/rubert-tiny-sentiment-balanced"
).split(",")

# Тестовые примеры
TEST_CASES = [
    # Негатив (проблемные случаи)
    ("ваша доставка полное дермище", "negative"),
    ("просто полная ерунда а не доставка, все плохо", "negative"),
    ("дерьмовый сервис, никогда больше не обращусь", "negative"),
    ("лажа полная, деньги на ветер", "negative"),
    ("отвратительная доставка, ужас просто", "negative"),
    ("полное дерьмо этот ваш сервис", "negative"),
    ("гадость редкая, не рекомендую", "negative"),
    ("все плохо, отстой полный", "negative"),
    
    # Нейтральные вопросы (проблемные случаи)
    ("подскажите какой у меня статус заказа?", "neutral"),
    ("алло, да, здравствуйте, хотелось бы уточнить когда будет готов мой заказ", "neutral"),
    ("во сколько привезут заказ?", "neutral"),
    ("как отследить посылку?", "neutral"),
    ("добрый день, хочу узнать время доставки", "neutral"),
    ("здравствуйте, подскажите статус заказа", "neutral"),
    ("когда будет доставка?", "neutral"),
    ("хочу уточнить время доставки", "neutral"),
    ("алло, можно узнать когда привезут?", "neutral"),
    ("здравствуйте, звонил по поводу доставки, хотелось бы уточнить", "neutral"),
    
    # Позитив
    ("отличная доставка!", "positive"),
    ("мне очень понравилось качество вашей продукции все супер", "positive"),
    ("спасибо за быструю доставку, молодцы", "positive"),
    ("прекрасная работа, буду заказывать еще", "positive"),
    ("великолепное качество, всем советую", "positive"),
    ("очень доволен сервисом, спасибо", "positive"),
    ("все отлично, быстро и качественно", "positive"),
    ("супер, доставка раньше срока", "positive"),
    
    # Смешанные/сложные случаи
    ("в целом неплохо, но могли бы и быстрее", "neutral"),
    ("заказ пришел вовремя, но упаковка помята", "negative"),
    ("спасибо, все хорошо, только курьер опоздал", "neutral"),
    ("неплохая доставка, но есть нюансы", "neutral"),
    ("ожидал большего за такие деньги", "negative"),
    ("качество хорошее, но доставка подвела", "negative"),
]


def test_model(model_name, test_cases):
    """Тестирование одной модели"""
    log.info(f"\n{'='*50}")
    log.info(f"🤖 Тестирование: {model_name}")
    
    # Загрузка
    start = time.time()
    try:
        classifier = pipeline(
            "sentiment-analysis",
            model=model_name,
            tokenizer=model_name,
            device=-1
        )
        load_time = time.time() - start
        log.info(f"✅ Загружена за {load_time:.2f}с")
    except Exception as e:
        log.error(f"❌ Ошибка загрузки: {e}")
        return None
    
    # Тестирование
    results = {
        "model": model_name,
        "load_time": load_time,
        "correct": 0,
        "total": len(test_cases),
        "total_time": 0,
        "errors": [],
        "distribution": defaultdict(int),
        "by_expected": defaultdict(lambda: {"correct": 0, "total": 0})
    }
    
    for text, expected in test_cases:
        start = time.time()
        result = classifier(text)[0]
        pred_time = time.time() - start
        results["total_time"] += pred_time
        
        pred_label = result['label'].lower()
        score = result['score']
        
        # Нормализация
        label_map = {
            'positive': 'positive', 'pos': 'positive',
            'negative': 'negative', 'neg': 'negative',
            'neutral': 'neutral', 'neu': 'neutral',
        }
        pred_label = label_map.get(pred_label, pred_label)
        
        results["distribution"][pred_label] += 1
        results["by_expected"][expected]["total"] += 1
        
        is_correct = pred_label == expected
        if is_correct:
            results["correct"] += 1
            results["by_expected"][expected]["correct"] += 1
            status = "✅"
        else:
            results["errors"].append({
                "text": text[:100],
                "expected": expected,
                "predicted": pred_label,
                "score": score
            })
            status = "❌"
        
        log.info(f"{status} [{expected}] {text[:60]:<60} → {pred_label} ({score:.3f})")
    
    # Статистика
    accuracy = results["correct"] / results["total"]
    avg_time = results["total_time"] / results["total"]
    
    log.info(f"\n📊 Результаты {model_name}:")
    log.info(f"  Точность: {accuracy:.1%} ({results['correct']}/{results['total']})")
    log.info(f"  Среднее время: {avg_time*1000:.1f}мс")
    
    # По классам
    log.info("  По классам:")
    for label in ['negative', 'neutral', 'positive']:
        stats = results["by_expected"][label]
        if stats["total"] > 0:
            acc = stats["correct"] / stats["total"]
            log.info(f"    {label}: {acc:.1%} ({stats['correct']}/{stats['total']})")
    
    # Примеры ошибок
    if results["errors"]:
        log.info(f"\n  ❌ Примеры ошибок (всего: {len(results['errors'])}):")
        for err in results["errors"][:5]:
            log.info(f"    [{err['expected']}→{err['predicted']}] {err['text'][:80]}... (score: {err['score']:.3f})")
    
    return {
        "accuracy": accuracy,
        "avg_time": avg_time,
        "load_time": load_time,
        "distribution": dict(results["distribution"]),
        "by_class": {
            label: {
                "accuracy": results["by_expected"][label]["correct"] / results["by_expected"][label]["total"]
                if results["by_expected"][label]["total"] > 0 else 0,
                "total": results["by_expected"][label]["total"]
            }
            for label in ['negative', 'neutral', 'positive']
        },
        "error_count": len(results["errors"]),
        "error_examples": results["errors"][:5]
    }


def main():
    """Главная функция"""
    log.info("🚀 Быстрый тест моделей сентимента (без БД)")
    log.info(f"📝 Тестовых примеров: {len(TEST_CASES)}")
    log.info(f"🤖 Моделей для тестирования: {len(MODELS)}")
    
    all_results = {}
    
    for model_name in MODELS:
        model_name = model_name.strip()
        results = test_model(model_name, TEST_CASES)
        if results:
            all_results[model_name] = results
    
    # Итоговое сравнение
    print("\n" + "="*80)
    print("🏆 ИТОГОВОЕ СРАВНЕНИЕ")
    print("="*80)
    
    # Сортируем по точности
    sorted_models = sorted(
        all_results.items(),
        key=lambda x: x[1]['accuracy'],
        reverse=True
    )
    
    print(f"\n{'Модель':<50} {'Точность':<10} {'Время':<10} {'Neg/Neu/Pos'}")
    print("-"*90)
    
    for name, data in sorted_models:
        short_name = name.split('/')[-1]
        dist = data["distribution"]
        dist_str = f"{dist.get('negative',0)}/{dist.get('neutral',0)}/{dist.get('positive',0)}"
        
        # Звездочки за точность
        stars = "⭐" if data["accuracy"] > 0.8 else ""
        if data["accuracy"] > 0.9:
            stars = "🌟🌟"
        if data["accuracy"] > 0.95:
            stars = "🌟🌟🌟"
        
        print(f"{short_name:<50} {data['accuracy']:>7.1%} {stars} {data['avg_time']*1000:>7.1f}мс {dist_str}")
    
    # Детальное сравнение по классам
    print(f"\n📊 ТОЧНОСТЬ ПО КЛАССАМ:")
    print(f"{'Модель':<40} {'Негатив':<12} {'Нейтрал':<12} {'Позитив':<12}")
    print("-"*80)
    
    for name, data in sorted_models:
        short_name = name.split('/')[-1]
        by_class = data["by_class"]
        neg = f"{by_class['negative']['accuracy']:.1%}"
        neu = f"{by_class['neutral']['accuracy']:.1%}"
        pos = f"{by_class['positive']['accuracy']:.1%}"
        print(f"{short_name:<40} {neg:<12} {neu:<12} {pos:<12}")
    
    # Рекомендация
    print(f"\n{'='*80}")
    print("💡 РЕКОМЕНДАЦИЯ")
    print(f"{'='*80}")
    
    if sorted_models:
        best = sorted_models[0]
        print(f"\n  Лучшая модель: {best[0]}")
        print(f"  Точность: {best[1]['accuracy']:.1%}")
        print(f"  Время ответа: {best[1]['avg_time']*1000:.1f}мс")
        
        # Анализ по классам
        by_class = best[1]["by_class"]
        if by_class["negative"]["accuracy"] < 0.8:
            print("  ⚠️  Возможны проблемы с определением негатива")
        if by_class["neutral"]["accuracy"] < 0.8:
            print("  ⚠️  Возможны проблемы с нейтральными текстами (вопросами)")
    
    print(f"\n  ✨ Для замены текущей модели используйте:")
    print(f"     MODEL_NAME={sorted_models[0][0]}")
    
    # Сохраняем результаты
    output_file = f"/app/output/quick_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    save_data = {
        "timestamp": datetime.now().isoformat(),
        "test_cases_count": len(TEST_CASES),
        "models_tested": len(MODELS),
        "results": {}
    }
    
    for name, data in all_results.items():
        save_data["results"][name] = {
            "accuracy": data["accuracy"],
            "avg_time": data["avg_time"],
            "load_time": data["load_time"],
            "by_class": data["by_class"],
            "error_count": data["error_count"]
        }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(save_data, f, ensure_ascii=False, indent=2)
    
    log.info(f"\n📁 Результаты сохранены в {output_file}")
    
    # Копия в latest
    with open("/app/output/latest_quick_test.json", 'w', encoding='utf-8') as f:
        json.dump(save_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Тестирование завершено! Результаты в файле: {output_file}")


if __name__ == "__main__":
    start_time = time.time()
    
    try:
        main()
    except KeyboardInterrupt:
        log.info("\nПрервано пользователем")
    except Exception as e:
        log.exception(f"Критическая ошибка: {e}")
    
    log.info(f"\n⏱️  Общее время: {time.time() - start_time:.1f}с")