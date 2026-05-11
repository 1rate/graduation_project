import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useRegister } from "@/features/auth";
import { registerSchema, type RegisterFormData } from "@/features/auth/model/auth.schema";

export const RegisterForm = () => {
  const { mutate: registerUser, isPending, error: apiError } = useRegister();

  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword: _, ...payload } = data;
    registerUser(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Имя
        </label>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  id="name"
                  type="text"
                  placeholder="Иван Петров"
                  className={error ? "border-destructive pl-10" : "pl-10"}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error.message}</p>}
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  id="email"
                  type="text"
                  placeholder="admin@example.com"
                  className={error ? "border-destructive pl-10" : "pl-10"}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error.message}</p>}
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Пароль
        </label>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={error ? "border-destructive pl-10" : "pl-10"}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error.message}</p>}
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Подтверждение пароля
        </label>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={error ? "border-destructive pl-10" : "pl-10"}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error.message}</p>}
            </div>
          )}
        />
      </div>

      {apiError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {(apiError as Error).message ?? "Ошибка регистрации"}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Регистрация..." : "Зарегистрироваться"}
      </Button>
    </form>
  );
};
