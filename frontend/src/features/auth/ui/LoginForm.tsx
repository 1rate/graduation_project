import { useLogin } from "@/features/auth";
import { loginSchema, type LoginFormData } from "@/features/auth/model/auth.schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, User } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

export const LoginForm = () => {
  const { mutate: login, isPending, error: apiError } = useLogin();

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          Имя пользователя
        </label>
        <Controller
          name="username"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  id="username"
                  type="text"
                  placeholder="admin"
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

      {apiError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {(apiError as Error).message ?? "Неверное имя пользователя или пароль"}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Вход..." : "Войти"}
      </Button>
    </form>
  );
};
