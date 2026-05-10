import { Link } from "react-router-dom";
import { AuthLayout } from "@/features/auth";
import { LoginForm } from "@/features/auth";

export const LoginPage = () => {
  return (
    <AuthLayout
      title="Вход в систему"
      description="Войдите для доступа к панели управления"
      footer={
        <>
          Нет аккаунта?{" "}
          <Link to="/auth/register" className="font-medium text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
};
