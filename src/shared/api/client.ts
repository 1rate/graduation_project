import axios, { type AxiosRequestConfig } from "axios";
import { requestInterceptor, createResponseInterceptor } from "@/shared/api/interceptors";

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
}

class ApiClient {
  private readonly instance;

  constructor(config: ApiClientConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 10_000,
      headers: { "Content-Type": "application/json" },
    });

    // Перехватчик запроса
    this.instance.interceptors.request.use(requestInterceptor);

    // Перехватчик ответа (фабрика, передаём инстанс внутрь)
    const respInterceptor = createResponseInterceptor(this.instance);
    this.instance.interceptors.response.use(
      respInterceptor.onFulfilled,
      respInterceptor.onRejected,
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  async upload<T>(
    url: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
  ): Promise<T> {
    const response = await this.instance.post<T>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return response.data;
  }
}

export const ingestApi = new ApiClient({
  baseURL: import.meta.env.VITE_INGEST_API_URL ?? "http://localhost:8080",
  timeout: 30_000,
});

export const analyticsApi = new ApiClient({
  baseURL: import.meta.env.VITE_ANALYTICS_API_URL ?? "http://localhost:8081",
  timeout: 15_000,
});

export const api = analyticsApi;
