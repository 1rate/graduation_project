import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useLogin } from "@/features/auth";
import { loginSchema, type LoginFormData } from "@/features/auth/model/auth.schema";

export const LoginForm = () => {
  const { mutate: login, isPending, error: apiError } = useLogin();

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Пароль
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            Забыли пароль?
          </Link>
        </div>
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
          {(apiError as Error).message ?? "Неверный email или пароль"}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Вход..." : "Войти"}
      </Button>
    </form>
  );
};
