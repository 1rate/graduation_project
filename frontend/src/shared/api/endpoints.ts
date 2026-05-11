export const endpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },

  // Ingest
  messages: {
    create: "/api/v1/messages",
  },

  // Search
  search: {
    list: "/api/v1/search",
    detail: (id: string) => `/api/v1/messages/${id}`,
  },

  // Stats
  stats: {
    sentiment: "/api/v1/stats/sentiment",
    categories: "/api/v1/stats/categories",
    timeline: "/api/v1/stats/timeline",
  },

  users: {
    me: "/users/me",
    update: "/users/me",
  },
} as const;
