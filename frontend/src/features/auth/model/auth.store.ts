import type { AuthResponse, LoginPayload, RegisterPayload } from "@/features/auth/model/auth.types";
import { api, endpoints } from "@/shared/api";

export const authApi = {
  login: (data: LoginPayload) => api.post<AuthResponse>(endpoints.auth.login, data),

  register: (data: RegisterPayload) => api.post<AuthResponse>(endpoints.auth.register, data),

  refresh: () => api.post<{ token: string }>(endpoints.auth.refresh),

  logout: () => api.post<void>(endpoints.auth.logout),

  getMe: () => api.get<{ user: AuthResponse["user"] }>(endpoints.users.me),
};
