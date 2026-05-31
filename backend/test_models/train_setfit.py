import pandas as pd
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle
import os

DATASET_PATH = os.environ.get("DATASET_PATH", "data/dataset.csv")
MODEL_OUTPUT = os.environ.get("MODEL_OUTPUT", "model")

# 1. Загрузка данных
df = pd.read_csv(DATASET_PATH)
texts = df["text"].tolist()
labels = df["label"].tolist()

# Кодирование меток в числа
label2id = {"negative": 0, "neutral": 1, "positive": 2}
id2label = {v: k for k, v in label2id.items()}
y = [label2id[l] for l in labels]

# 2. Разделение
train_texts, val_texts, train_y, val_y = train_test_split(
    texts, y, test_size=0.2, random_state=42, stratify=y
)

# 3. Базовая модель для эмбеддингов (лёгкая русская)
embedder = SentenceTransformer("cointegrated/rubert-tiny2")

# 4. Получение эмбеддингов для обучения
train_emb = embedder.encode(train_texts, show_progress_bar=True)
val_emb = embedder.encode(val_texts, show_progress_bar=True)

# 5. Обучение классификатора (с балансировкой классов)
clf = LogisticRegression(max_iter=1000, class_weight='balanced', C=0.5, random_state=42)
clf.fit(train_emb, train_y)

# 6. Оценка
val_pred = clf.predict(val_emb)
acc = accuracy_score(val_y, val_pred)
print(f"Validation accuracy: {acc:.4f}")

# 7. Сохранение модели
os.makedirs(MODEL_OUTPUT, exist_ok=True)
# Сохраняем sentence-transformer
embedder.save(os.path.join(MODEL_OUTPUT, "transformer"))
# Сохраняем классификатор и маппинг
with open(os.path.join(MODEL_OUTPUT, "classifier.pkl"), "wb") as f:
    pickle.dump((clf, label2id, id2label), f)

print(f"✅ Модель сохранена в {MODEL_OUTPUT}")