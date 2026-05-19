import type { LoginFormData, RegisterFormData } from "@/features/auth/model/auth.schema";

export type LoginPayload = LoginFormData;
export type RegisterPayload = Omit<RegisterFormData, "confirmPassword">;

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: "user" | "admin";
    created_at: string;
  };
}
