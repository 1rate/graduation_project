import { http, HttpResponse } from "msw";
import type { SearchResponse, Timeline } from "@/shared/types/api";

// Базовые URL (без /api/v1 — они в эндпоинтах)
const ANALYTICS = "http://localhost:8081";
const INGEST = "http://localhost:8080";

// ============================================
// Моковые данные
// ============================================

const mockSentimentBuckets = [
  { key: "positive", count: 524 },
  { key: "neutral", count: 436 },
  { key: "negative", count: 287 },
];

const mockCategoriesBuckets = [
  { key: "Жалоба на сервис", count: 312 },
  { key: "Вопрос по оплате", count: 245 },
  { key: "Техническая проблема", count: 198 },
  { key: "Предложение", count: 89 },
  { key: "Благодарность", count: 67 },
  { key: "Возврат средств", count: 54 },
  { key: "Другое", count: 282 },
];

const mockRecentMessages: SearchResponse["items"] = [
  {
    message_id: "a1b2c3d4-0001",
    source: "text",
    text: "Не могу войти в личный кабинет уже второй день, ошибка 500",
    received_at: "2025-05-11T10:30:00Z",
    sentiment: { label: "negative", score: 0.92, model_version: "rubert-tiny2-v1" },
    category: { category: "Техническая проблема", score: 0.88, model_version: "rubert-tiny2-v1" },
  },
  {
    message_id: "a1b2c3d4-0002",
    source: "audio",
    text: "Здравствуйте, хочу выразить благодарность сотруднику Иванову за быструю помощь",
    received_at: "2025-05-11T09:15:00Z",
    sentiment: { label: "positive", score: 0.95, model_version: "rubert-tiny2-v1" },
    category: { category: "Благодарность", score: 0.91, model_version: "rubert-tiny2-v1" },
  },
  {
    message_id: "a1b2c3d4-0003",
    source: "text",
    text: "Когда будет начислен кешбэк за прошлый месяц?",
    received_at: "2025-05-11T08:45:00Z",
    sentiment: { label: "neutral", score: 0.78, model_version: "rubert-tiny2-v1" },
    category: { category: "Вопрос по оплате", score: 0.85, model_version: "rubert-tiny2-v1" },
  },
  {
    message_id: "a1b2c3d4-0004",
    source: "text",
    text: "Ваше приложение постоянно вылетает на Android 14",
    received_at: "2025-05-10T22:10:00Z",
    sentiment: { label: "negative", score: 0.89, model_version: "rubert-tiny2-v1" },
    category: { category: "Техническая проблема", score: 0.93, model_version: "rubert-tiny2-v1" },
  },
  {
    message_id: "a1b2c3d4-0005",
    source: "text",
    text: "Предлагаю добавить тёмную тему в интерфейс",
    received_at: "2025-05-10T18:30:00Z",
    sentiment: { label: "positive", score: 0.71, model_version: "rubert-tiny2-v1" },
    category: { category: "Предложение", score: 0.82, model_version: "rubert-tiny2-v1" },
  },
];

const mockTimelinePoints: Timeline["points"] = [
  {
    bucket: "2025-05-05T00:00:00Z",
    total: 124,
    counts: { positive: 52, neutral: 43, negative: 29 },
  },
  {
    bucket: "2025-05-06T00:00:00Z",
    total: 145,
    counts: { positive: 61, neutral: 50, negative: 34 },
  },
  {
    bucket: "2025-05-07T00:00:00Z",
    total: 138,
    counts: { positive: 58, neutral: 48, negative: 32 },
  },
  {
    bucket: "2025-05-08T00:00:00Z",
    total: 167,
    counts: { positive: 72, neutral: 55, negative: 40 },
  },
  {
    bucket: "2025-05-09T00:00:00Z",
    total: 152,
    counts: { positive: 64, neutral: 52, negative: 36 },
  },
  {
    bucket: "2025-05-10T00:00:00Z",
    total: 201,
    counts: { positive: 89, neutral: 67, negative: 45 },
  },
  {
    bucket: "2025-05-11T00:00:00Z",
    total: 178,
    counts: { positive: 78, neutral: 59, negative: 41 },
  },
];

// ============================================
// Хендлеры
// ============================================

export const handlers = [
  // Stats
  http.get(`${ANALYTICS}/api/v1/stats/sentiment`, () => {
    return HttpResponse.json({ buckets: mockSentimentBuckets });
  }),

  http.get(`${ANALYTICS}/api/v1/stats/categories`, () => {
    return HttpResponse.json({ buckets: mockCategoriesBuckets });
  }),

  http.get(`${ANALYTICS}/api/v1/stats/timeline`, ({ request }) => {
    const url = new URL(request.url);
    const metric = url.searchParams.get("metric") ?? "sentiment";
    return HttpResponse.json({
      bucket: "day",
      metric,
      points: mockTimelinePoints,
    });
  }),

  // Search
  http.get(`${ANALYTICS}/api/v1/search`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const size = parseInt(url.searchParams.get("size") ?? "20");

    let filtered = mockRecentMessages;
    if (q) {
      filtered = filtered.filter((m) => m.text.toLowerCase().includes(q.toLowerCase()));
    }

    return HttpResponse.json({
      total: filtered.length,
      page,
      size,
      items: filtered.slice((page - 1) * size, page * size),
    });
  }),

  // Message detail
  http.get(`${ANALYTICS}/api/v1/messages/:id`, ({ params }) => {
    const message = mockRecentMessages.find((m) => m.message_id === params.id);
    if (!message) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({
      ...message,
      id: message.message_id,
      status: "enriched",
      updated_at: message.received_at,
    });
  }),

  // Ingest
  http.post(`${INGEST}/api/v1/messages`, () => {
    return HttpResponse.json(
      {
        message_id: crypto.randomUUID?.() ?? "mock-uuid",
        status: "pending",
      },
      { status: 202 },
    );
  }),
];
