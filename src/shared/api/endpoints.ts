/**
 * Фабрика эндпоинтов.
 *
 * В будущем будет генерироваться автоматически из OpenAPI-спек.
 * Пока — ручное объявление с автодополнением.
 */

export const endpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
  calls: {
    list: "/calls",
    detail: (id: string) => `/calls/${id}`,
    upload: "/calls/upload",
    getTranscript: (id: string) => `/calls/${id}/transcript`,
  },
  stats: {
    dashboard: "/stats/dashboard",
    toneBreakdown: "/stats/tone-breakdown",
    trends: "/stats/trends",
  },
  users: {
    me: "/users/me",
    update: "/users/me",
  },
} as const;
