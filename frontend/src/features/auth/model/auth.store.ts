import type { AuthResponse, LoginPayload } from "@/features/auth/model/auth.types";
import { api, endpoints } from "@/shared/api";

export const authApi = {
  login: (data: LoginPayload) => api.post<AuthResponse>(endpoints.auth.login, data),

  // Регистрация — заглушка на будущее, пока не используется
  register: (data: LoginPayload & { confirmPassword?: string }) =>
    api.post<AuthResponse>("/api/v1/auth/register", data),
};
