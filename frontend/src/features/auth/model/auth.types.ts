import type { LoginFormData, RegisterFormData } from "@/features/auth/model/auth.schema";

export type LoginPayload = LoginFormData;
export type RegisterPayload = Omit<RegisterFormData, "confirmPassword">;

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
