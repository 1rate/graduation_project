import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Имя пользователя обязательно"),
  password: z.string().min(1, "Пароль обязателен").min(3, "Пароль должен быть не менее 3 символов"),
});

export const registerSchema = z
  .object({
    username: z.string().min(1, "Имя пользователя обязательно").min(3, "Минимум 3 символа"),
    password: z
      .string()
      .min(1, "Пароль обязателен")
      .min(6, "Пароль должен быть не менее 6 символов"),
    confirmPassword: z.string().min(1, "Подтверждение пароля обязательно"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
