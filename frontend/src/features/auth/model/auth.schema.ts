import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email обязателен").email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен").min(6, "Пароль должен быть не менее 6 символов"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Имя обязательно").min(2, "Имя должно быть не менее 2 символов"),
    email: z.string().min(1, "Email обязателен").email("Некорректный email"),
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
