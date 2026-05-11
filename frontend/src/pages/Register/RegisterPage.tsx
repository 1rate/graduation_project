import { Link } from "react-router-dom";
import { AuthLayout } from "@/features/auth";
import { RegisterForm } from "@/features/auth";

export const RegisterPage = () => {
  return (
    <AuthLayout
      title="Регистрация"
      description="Создайте аккаунт для начала работы"
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link to="/auth/login" className="font-medium text-primary hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
};
