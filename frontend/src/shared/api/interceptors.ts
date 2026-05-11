import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { ApiError } from "@/shared/api/errors";
import type { ApiErrorResponse } from "@/shared/api/errors";

// ============================================
// Хранилище токенов
// ============================================
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenStorage = {
  getAccessToken: (): string | null => accessToken,
  getRefreshToken: (): string | null => refreshToken,
  setTokens: (access: string, refresh?: string) => {
    accessToken = access;
    if (refresh) refreshToken = refresh;
  },
  clear: () => {
    accessToken = null;
    refreshToken = null;
  },
};

// ============================================
// Рефреш
// ============================================
type RefreshHandler = () => Promise<string | null>;

let refreshHandler: RefreshHandler | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export const setRefreshHandler = (handler: RefreshHandler) => {
  refreshHandler = handler;
};

const processRefreshQueue = (token: string | null) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

// ============================================
// Перехватчик запроса
// ============================================
export const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// ============================================
// Перехватчик ответа
// ============================================
// Фабрика — принимает инстанс axios, чтобы не было циклического импорта
export const createResponseInterceptor = (axiosInstance: AxiosInstance) => ({
  onFulfilled: (response: AxiosResponse) => response,

  onRejected: async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Сетевая ошибка
    if (!error.response) {
      return Promise.reject(
        new ApiError(0, "NETWORK_ERROR", "Сетевая ошибка. Проверьте подключение"),
      );
    }

    const { status, data } = error.response;

    // 401 — рефреш
    if (status === 401 && !originalRequest._retry && refreshHandler) {
      if (isRefreshing) {
        // Очередь
        return new Promise<AxiosResponse>((resolve, reject) => {
          refreshQueue.push((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance.request(originalRequest));
            } else {
              reject(new ApiError(401, "UNAUTHORIZED", "Сессия истекла"));
            }
          });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const newToken = await refreshHandler();
        tokenStorage.setTokens(newToken ?? "");
        processRefreshQueue(newToken);

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance.request(originalRequest);
        }
      } catch {
        processRefreshQueue(null);
        tokenStorage.clear();
        return Promise.reject(new ApiError(401, "UNAUTHORIZED", "Сессия истекла"));
      } finally {
        isRefreshing = false;
      }
    }

    // Остальные ошибки
    const message = data?.message ?? `HTTP ${status}`;
    const code = data?.code ?? "UNKNOWN_ERROR";
    return Promise.reject(new ApiError(status, code, message, data?.details));
  },
});
