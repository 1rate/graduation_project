export const endpoints = {
  auth: {
    login: "/api/v1/auth/login",
  },

  categories: "/api/v1/categories",

  admin: {
    users: "/api/v1/admin/users",
    userDetail: (id: string) => `/api/v1/admin/users/${id}`,
    userCategories: (id: string) => `/api/v1/admin/users/${id}/categories`,
  },

  messages: {
    create: "/api/v1/messages",
  },

  search: {
    list: "/api/v1/search",
    detail: (id: string) => `/api/v1/messages/${id}`,
  },

  stats: {
    sentiment: "/api/v1/stats/sentiment",
    categories: "/api/v1/stats/categories",
    timeline: "/api/v1/stats/timeline",
  },
} as const;
